using Backend.Application.Authorization;
using Backend.Shared.Constants;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Backend.Application.Interfaces.Services;
using Backend.Domain.Entities.Scada;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Infrastructure.Identity;

/// <summary>
/// JWT issuer for SCADA operators. Role + permission claims are derived server-side
/// via <see cref="ScadaRolePermissionResolver"/> — never from the client.
/// </summary>
public class ScadaTokenService(IOptions<JwtSettings> jwtOptions) : IScadaTokenService
{
    public const string UsernameClaimType = "username";
    public const string RoleClaimType = "role";

    private readonly JwtSettings _settings = jwtOptions.Value;

    public (string AccessToken, DateTimeOffset ExpiresAt) CreateAccessToken(ScadaUser user, string sessionId)
    {
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_settings.AccessTokenExpirationMinutes);
        var now = DateTimeOffset.UtcNow;
        var canonicalRole = ScadaRolePermissionResolver.ResolveCanonicalRole(user.Role);
        var permissions = ScadaRolePermissionResolver.ResolvePermissions(user.Role);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat, now.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new(UsernameClaimType, user.Username),
            new(RoleClaimType, canonicalRole),
            new(ClaimTypes.Role, canonicalRole),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypesExtended.SessionId, sessionId)
        };

        // Keep legacy role aliases so older [Authorize(Roles = "Viewer|Operator|Admin")] still match.
        foreach (var legacy in LegacyRoleAliases(canonicalRole))
            claims.Add(new Claim(ClaimTypes.Role, legacy));

        foreach (var permission in permissions)
            claims.Add(new Claim(ClaimTypesExtended.Permission, permission));

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SigningKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    public string CreateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Base64UrlEncode(bytes);
    }

    public string CreatePasswordResetToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Base64UrlEncode(bytes);
    }

    public ClaimsPrincipal? ValidateAccessToken(string token)
    {
        try
        {
            var parameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = _settings.Issuer,
                ValidateAudience = true,
                ValidAudience = _settings.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SigningKey)),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30),
                RoleClaimType = RoleClaimType,
                NameClaimType = UsernameClaimType
            };

            var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
            var principal = handler.ValidateToken(token, parameters, out var securityToken);

            if (securityToken is not JwtSecurityToken jwt ||
                !jwt.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.OrdinalIgnoreCase))
                return null;

            return principal;
        }
        catch (Exception ex) when (ex is SecurityTokenException or ArgumentException)
        {
            return null;
        }
    }

    private static IEnumerable<string> LegacyRoleAliases(string canonical) =>
        canonical switch
        {
            ScadaRoles.View => ["Viewer", "VIEW"],
            ScadaRoles.Operator => ["Operator", "OPERATOR"],
            ScadaRoles.Technical => ["Technical", "TECHNICAL"],
            ScadaRoles.Admin => ["Admin", "ADMIN", Roles.SuperAdmin],
            _ => []
        };

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}

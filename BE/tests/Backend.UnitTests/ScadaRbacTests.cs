using System.Security.Claims;
using Backend.Application.Authorization;
using Backend.Domain.Entities.Scada;
using Backend.Infrastructure.Identity;
using Backend.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Backend.UnitTests;

public class ScadaRolePermissionResolverTests
{
    [Theory]
    [InlineData("viewer", ScadaRoles.View)]
    [InlineData("VIEW", ScadaRoles.View)]
    [InlineData("Operator", ScadaRoles.Operator)]
    [InlineData("technical", ScadaRoles.Technical)]
    [InlineData("engineer", ScadaRoles.Technical)]
    [InlineData("administrator", ScadaRoles.Admin)]
    [InlineData("ADMIN", ScadaRoles.Admin)]
    public void TryNormalize_Accepts_Legacy_And_Canonical(string raw, string expected) =>
        Assert.Equal(expected, ScadaRolePermissionResolver.TryNormalize(raw));

    [Fact]
    public void Unknown_Role_Yields_No_Permissions() =>
        Assert.Empty(ScadaRolePermissionResolver.ResolvePermissions("MaintenanceManager"));

    [Theory]
    [InlineData(ScadaRoles.View, Permissions.Realtime.View, true)]
    [InlineData(ScadaRoles.View, Permissions.History.View, false)]
    [InlineData(ScadaRoles.View, Permissions.Report.View, false)]
    [InlineData(ScadaRoles.View, Permissions.Technical.View, false)]
    [InlineData(ScadaRoles.View, Permissions.UserManagement.View, false)]
    [InlineData(ScadaRoles.Operator, Permissions.Realtime.View, true)]
    [InlineData(ScadaRoles.Operator, Permissions.Trend.View, true)]
    [InlineData(ScadaRoles.Operator, Permissions.History.View, true)]
    [InlineData(ScadaRoles.Operator, Permissions.Report.View, true)]
    [InlineData(ScadaRoles.Operator, Permissions.Technical.View, false)]
    [InlineData(ScadaRoles.Operator, Permissions.UserManagement.View, false)]
    [InlineData(ScadaRoles.Technical, Permissions.Realtime.View, true)]
    [InlineData(ScadaRoles.Technical, Permissions.Technical.Edit, true)]
    [InlineData(ScadaRoles.Technical, Permissions.Configuration.Edit, true)]
    [InlineData(ScadaRoles.Technical, Permissions.UserManagement.View, false)]
    [InlineData(ScadaRoles.Admin, Permissions.Realtime.View, true)]
    [InlineData(ScadaRoles.Admin, Permissions.Technical.Edit, true)]
    [InlineData(ScadaRoles.Admin, Permissions.UserManagement.Edit, true)]
    [InlineData(ScadaRoles.Admin, Permissions.RoleManagement.Manage, true)]
    [InlineData(ScadaRoles.Admin, Permissions.SystemAdministration.Manage, true)]
    public void Permission_Matrix_By_Role(string role, string permission, bool expected) =>
        Assert.Equal(expected, ScadaRolePermissionResolver.HasPermission(role, permission));
}

public class ScadaRbacAuthorizationPolicyTests
{
    private static IAuthorizationService CreateAuthz()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var builder = services.AddAuthorizationBuilder();
        foreach (var permission in Permissions.AllScadaPolicies)
        {
            var p = permission;
            builder.AddPolicy(p, policy => policy.RequireClaim(ClaimTypesExtended.Permission, p));
        }

        return services.BuildServiceProvider().GetRequiredService<IAuthorizationService>();
    }

    private static ClaimsPrincipal PrincipalForRole(string role)
    {
        var user = new ScadaUser
        {
            Id = 1,
            Username = "u",
            FullName = "U",
            Role = role,
            IsActive = true,
            PasswordHash = "x"
        };
        var tokenService = new ScadaTokenService(Options.Create(new JwtSettings
        {
            Issuer = "Backend.Api",
            Audience = "Backend.Client",
            SigningKey = "UNIT_TEST_SIGNING_KEY_AT_LEAST_32_CHARS!!",
            AccessTokenExpirationMinutes = 15,
            RefreshTokenExpirationDays = 7
        }));
        var (token, _) = tokenService.CreateAccessToken(user, "sid-test");
        return tokenService.ValidateAccessToken(token)!;
    }

    public static IEnumerable<object[]> Matrix()
    {
        // role, policy, expectedAllowed
        yield return [ScadaRoles.View, Permissions.Realtime.View, true];
        yield return [ScadaRoles.View, Permissions.Trend.View, false];
        yield return [ScadaRoles.View, Permissions.History.View, false];
        yield return [ScadaRoles.View, Permissions.Report.View, false];
        yield return [ScadaRoles.View, Permissions.Technical.View, false];
        yield return [ScadaRoles.View, Permissions.UserManagement.View, false];

        yield return [ScadaRoles.Operator, Permissions.Realtime.View, true];
        yield return [ScadaRoles.Operator, Permissions.Trend.View, true];
        yield return [ScadaRoles.Operator, Permissions.History.View, true];
        yield return [ScadaRoles.Operator, Permissions.Report.View, true];
        yield return [ScadaRoles.Operator, Permissions.Technical.View, false];
        yield return [ScadaRoles.Operator, Permissions.UserManagement.View, false];

        yield return [ScadaRoles.Technical, Permissions.Realtime.View, true];
        yield return [ScadaRoles.Technical, Permissions.Trend.View, true];
        yield return [ScadaRoles.Technical, Permissions.History.View, true];
        yield return [ScadaRoles.Technical, Permissions.Report.View, true];
        yield return [ScadaRoles.Technical, Permissions.Technical.View, true];
        yield return [ScadaRoles.Technical, Permissions.UserManagement.View, false];

        yield return [ScadaRoles.Admin, Permissions.Realtime.View, true];
        yield return [ScadaRoles.Admin, Permissions.Trend.View, true];
        yield return [ScadaRoles.Admin, Permissions.History.View, true];
        yield return [ScadaRoles.Admin, Permissions.Report.View, true];
        yield return [ScadaRoles.Admin, Permissions.Technical.View, true];
        yield return [ScadaRoles.Admin, Permissions.UserManagement.View, true];
    }

    [Theory]
    [MemberData(nameof(Matrix))]
    public async Task Jwt_Permission_Policies_Match_Role_Matrix(string role, string policy, bool allowed)
    {
        var authz = CreateAuthz();
        var principal = PrincipalForRole(role);
        var result = await authz.AuthorizeAsync(principal, policy);
        Assert.Equal(allowed, result.Succeeded);
    }

    [Fact]
    public async Task Unauthenticated_Principal_Is_Denied()
    {
        var authz = CreateAuthz();
        var result = await authz.AuthorizeAsync(new ClaimsPrincipal(new ClaimsIdentity()), Permissions.Realtime.View);
        Assert.False(result.Succeeded);
    }

    [Fact]
    public void Tampered_Token_Is_Rejected()
    {
        var tokenService = new ScadaTokenService(Options.Create(new JwtSettings
        {
            Issuer = "Backend.Api",
            Audience = "Backend.Client",
            SigningKey = "UNIT_TEST_SIGNING_KEY_AT_LEAST_32_CHARS!!",
            AccessTokenExpirationMinutes = 15,
            RefreshTokenExpirationDays = 7
        }));
        var user = new ScadaUser
        {
            Id = 1,
            Username = "u",
            FullName = "U",
            Role = ScadaRoles.View,
            IsActive = true,
            PasswordHash = "x"
        };
        var (token, _) = tokenService.CreateAccessToken(user, "sid");
        var parts = token.Split('.');
        Assert.Equal(3, parts.Length);
        // Flip a character in the payload segment.
        var payload = parts[1].ToCharArray();
        payload[^1] = payload[^1] == 'A' ? 'B' : 'A';
        var tampered = $"{parts[0]}.{new string(payload)}.{parts[2]}";
        Assert.Null(tokenService.ValidateAccessToken(tampered));
    }

    [Fact]
    public void Auth_Responses_Expose_Permissions_Property()
    {
        Assert.NotNull(typeof(Backend.Application.DTOs.Auth.AuthTokenResponse).GetProperty("Permissions"));
        Assert.NotNull(typeof(Backend.Application.DTOs.Auth.CurrentUserResponse).GetProperty("Permissions"));
    }
}

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend.Application.Interfaces.Services;
using Backend.Shared.Constants;

namespace Backend.Infrastructure.Identity;

public enum AccessTokenSessionState
{
    Active,
    Ended,
    Unavailable
}

/// <summary>
/// An access token is only honoured while the login session (sid) that issued it is
/// still alive in Redis. Logout, revocation (password change/reset, role change,
/// deactivate, delete, refresh reuse) or eviction ends the session, so every token of
/// that session is rejected immediately instead of living until its exp.
/// </summary>
public static class AccessTokenSessionValidator
{
    public const string SessionExpiredHeader = "Session-Expired";

    public static async Task<AccessTokenSessionState> ValidateAsync(
        ClaimsPrincipal? principal,
        IConcurrentSessionService sessions,
        CancellationToken cancellationToken = default)
    {
        var sessionId = principal?.FindFirst(ClaimTypesExtended.SessionId)?.Value;
        var userId = principal?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(userId))
            return AccessTokenSessionState.Ended;

        return await sessions.IsActiveAsync(sessionId, userId, cancellationToken) switch
        {
            true => AccessTokenSessionState.Active,
            false => AccessTokenSessionState.Ended,
            null => AccessTokenSessionState.Unavailable
        };
    }
}

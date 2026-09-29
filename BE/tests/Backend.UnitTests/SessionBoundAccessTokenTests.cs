using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend.Application.Interfaces.Services;
using Backend.Infrastructure.Identity;
using Backend.Shared.Constants;
using Backend.Shared.Results;

namespace Backend.UnitTests;

public class SessionBoundAccessTokenTests
{
    private sealed class FakeSessions : IConcurrentSessionService
    {
        public Dictionary<string, string> Active { get; } = new();
        public bool RedisDown { get; set; }

        public Task<bool?> IsActiveAsync(string sessionId, string? userId, CancellationToken cancellationToken = default)
        {
            if (RedisDown) return Task.FromResult<bool?>(null);
            return Task.FromResult<bool?>(Active.TryGetValue(sessionId, out var owner) && owner == userId);
        }

        public Task ReleaseAsync(string sessionId, CancellationToken cancellationToken = default)
        {
            Active.Remove(sessionId);
            return Task.CompletedTask;
        }

        public Task<ConcurrentSessionAcquireResult> TryAcquireAsync(ConcurrentSessionAcquireRequest request, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<bool> ExtendAsync(string sessionId, CancellationToken cancellationToken = default)
            => Task.FromResult(Active.ContainsKey(sessionId));

        public Task<Result<ConcurrentUsersStatusDto>> GetStatusAsync(CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
    }

    private static ClaimsPrincipal Principal(string? userId, string? sessionId)
    {
        var claims = new List<Claim>();
        if (userId is not null) claims.Add(new Claim(JwtRegisteredClaimNames.Sub, userId));
        if (sessionId is not null) claims.Add(new Claim(ClaimTypesExtended.SessionId, sessionId));
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));
    }

    [Fact]
    public async Task Token_of_active_session_is_accepted()
    {
        var sessions = new FakeSessions();
        sessions.Active["s1"] = "7";

        Assert.Equal(AccessTokenSessionState.Active,
            await AccessTokenSessionValidator.ValidateAsync(Principal("7", "s1"), sessions));
    }

    [Fact]
    public async Task Token_is_rejected_right_after_logout_releases_its_session()
    {
        var sessions = new FakeSessions();
        sessions.Active["s1"] = "7";
        await sessions.ReleaseAsync("s1");

        Assert.Equal(AccessTokenSessionState.Ended,
            await AccessTokenSessionValidator.ValidateAsync(Principal("7", "s1"), sessions));
    }

    [Fact]
    public async Task Token_of_previous_session_is_not_valid_in_a_new_login_session()
    {
        var sessions = new FakeSessions();
        sessions.Active["s1"] = "7";
        await sessions.ReleaseAsync("s1");
        sessions.Active["s2"] = "7";

        Assert.Equal(AccessTokenSessionState.Ended,
            await AccessTokenSessionValidator.ValidateAsync(Principal("7", "s1"), sessions));
        Assert.Equal(AccessTokenSessionState.Active,
            await AccessTokenSessionValidator.ValidateAsync(Principal("7", "s2"), sessions));
    }

    [Fact]
    public async Task Session_of_another_user_is_rejected()
    {
        var sessions = new FakeSessions();
        sessions.Active["s1"] = "7";

        Assert.Equal(AccessTokenSessionState.Ended,
            await AccessTokenSessionValidator.ValidateAsync(Principal("8", "s1"), sessions));
    }

    [Theory]
    [InlineData(null, "s1")]
    [InlineData("7", null)]
    [InlineData("7", "")]
    public async Task Token_without_session_or_subject_is_rejected(string? userId, string? sessionId)
    {
        var sessions = new FakeSessions();
        sessions.Active["s1"] = "7";

        Assert.Equal(AccessTokenSessionState.Ended,
            await AccessTokenSessionValidator.ValidateAsync(Principal(userId, sessionId), sessions));
    }

    [Fact]
    public async Task Redis_outage_is_reported_as_unavailable()
    {
        var sessions = new FakeSessions { RedisDown = true };

        Assert.Equal(AccessTokenSessionState.Unavailable,
            await AccessTokenSessionValidator.ValidateAsync(Principal("7", "s1"), sessions));
    }
}

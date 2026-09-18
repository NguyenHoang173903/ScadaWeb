using Backend.Application.Interfaces.Services;
using Backend.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Identity;

/// <summary>
/// Revokes SCADA refresh tokens and Redis concurrent-session slots for a user.
/// Used after role change / deactivate so elevated access cannot linger via refresh.
/// Access JWT remains valid until natural expiry (short TTL).
/// </summary>
public class ScadaSessionRevocationService(
    ApplicationDbContext db,
    IConcurrentSessionService concurrentSessionService) : IScadaSessionRevocationService
{
    public async Task RevokeAllSessionsAsync(long userId, CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var active = await db.ScadaRefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in active)
        {
            token.RevokedAt = now;
            token.UpdatedAt = now;
            if (!string.IsNullOrWhiteSpace(token.SessionId))
                await concurrentSessionService.ReleaseAsync(token.SessionId, cancellationToken);
        }

        if (active.Count > 0)
            await db.SaveChangesAsync(cancellationToken);
    }
}

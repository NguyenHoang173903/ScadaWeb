namespace Backend.Application.Interfaces.Services;

/// <summary>Revokes SCADA refresh tokens + Redis sessions for a user (role change / deactivate).</summary>
public interface IScadaSessionRevocationService
{
    Task RevokeAllSessionsAsync(long userId, CancellationToken cancellationToken = default);
}

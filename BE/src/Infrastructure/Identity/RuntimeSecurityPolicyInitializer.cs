using Backend.Application.Interfaces.Services.Scada;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Identity;

public sealed class RuntimeSecurityPolicyInitializer(
    IServiceScopeFactory scopeFactory,
    ILogger<RuntimeSecurityPolicyInitializer> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var settings = scope.ServiceProvider.GetRequiredService<IAppSettingQueryService>();
            var result = await settings.GetPasswordPolicyAsync(cancellationToken);
            if (result.IsFailure)
                logger.LogWarning("Runtime security policy could not be loaded: {Errors}", result.Errors);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Runtime security policy initialization failed; appsettings defaults remain active");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}

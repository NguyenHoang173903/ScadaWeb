using Backend.Application.Configuration;
using Backend.Application.DTOs.Audit;
using Backend.Api.Controllers;
using Backend.Api.Controllers.Scada;
using Backend.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Xunit;

namespace Backend.UnitTests;

public class AppSettingCatalogTests
{
    [Fact]
    public void SessionIdle_IsEditable_AndValidatesRange()
    {
        Assert.True(AppSettingCatalog.TryValidateEditableValue(
            AppSettingCatalog.SessionIdleTimeoutMinutes, "15", out _));
        Assert.False(AppSettingCatalog.TryValidateEditableValue(
            AppSettingCatalog.SessionIdleTimeoutMinutes, "0", out _));
        Assert.False(AppSettingCatalog.TryValidateEditableValue(
            AppSettingCatalog.SessionIdleTimeoutMinutes, "abc", out _));
    }

    [Fact]
    public void SecretsAndOptions_AreNotEditableViaApi()
    {
        Assert.False(AppSettingCatalog.TryValidateEditableValue("jwt.signingKey", "x", out _));
        Assert.False(AppSettingCatalog.TryValidateEditableValue("password.expireDays", "90", out _));
        Assert.False(AppSettingCatalog.TryValidateEditableValue("unknown.key", "1", out _));
    }
}

public class ClientAuditOwnershipTests
{
    [Theory]
    [InlineData("Login", true)]
    [InlineData("login-failed", true)]
    [InlineData("Export", true)]
    [InlineData("AcknowledgeAlarm", true)]
    [InlineData("session-expired", false)]
    [InlineData("ui-navigation", false)]
    public void BackendOwnedActions_AreDetected(string eventType, bool owned) =>
        Assert.Equal(owned, BackendOwnedAuditActions.IsBackendOwned(eventType));
}

public class PhaseNextAuthorizationTests
{
    [Fact]
    public void AppSettingsController_RequiresConfigurationEdit()
    {
        var attr = typeof(AppSettingsController).GetCustomAttributes(typeof(AuthorizeAttribute), true)
            .Cast<AuthorizeAttribute>().Single();
        Assert.Equal(Permissions.Configuration.Edit, attr.Policy);
    }

    [Fact]
    public void MapLayersController_RequiresAuth_MutationsConfigurationEdit()
    {
        Assert.Contains(
            typeof(MapLayersController).GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>(),
            a => a.Policy == Permissions.Realtime.View);

        var upload = typeof(MapLayersController).GetMethod(nameof(MapLayersController.Upload))!;
        Assert.Equal(
            Permissions.Configuration.Edit,
            upload.GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>().Single().Policy);
    }

    [Fact]
    public void LicensesController_RequiresSystemAdministration()
    {
        var attr = typeof(LicensesController).GetCustomAttributes(typeof(AuthorizeAttribute), true)
            .Cast<AuthorizeAttribute>().Single();
        Assert.Equal(Permissions.SystemAdministration.Manage, attr.Policy);
    }

    [Fact]
    public void AlarmAcknowledge_RequiresAlarmAcknowledgePermission()
    {
        var method = typeof(AlarmHistoriesController).GetMethod(nameof(AlarmHistoriesController.Acknowledge))!;
        var policy = method.GetCustomAttributes(typeof(AuthorizeAttribute), true)
            .Cast<AuthorizeAttribute>().Single().Policy;
        Assert.Equal(Permissions.Alarm.Acknowledge, policy);
    }
}

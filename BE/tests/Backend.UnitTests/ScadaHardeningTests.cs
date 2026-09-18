using Backend.Api.Controllers;
using Backend.Api.Controllers.Scada;
using Backend.Api.Realtime;
using Backend.Application.Common;
using Backend.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Xunit;

namespace Backend.UnitTests;

public class PasswordComplexityTests
{
    [Theory]
    [InlineData("Abcd1234!", true)]
    [InlineData("short1!", false)]
    [InlineData("alllowercase1!", false)]
    [InlineData("ALLUPPERCASE1!", false)]
    [InlineData("NoDigits!!!!", false)]
    [InlineData("NoSpecial12", false)]
    public void TryValidate_DefaultPolicy(string password, bool expected)
    {
        var ok = PasswordComplexity.TryValidate(
            password,
            PasswordComplexity.DefaultMinLength,
            PasswordComplexity.DefaultMaxLength,
            requireUppercase: true,
            requireLowercase: true,
            requireDigit: true,
            requireSpecial: true,
            out _);
        Assert.Equal(expected, ok);
    }
}

public class ScadaAuthorizationSurfaceTests
{
    [Theory]
    [InlineData(typeof(ScadaUsersController), Permissions.UserManagement.View)]
    [InlineData(typeof(AppSettingsController), Permissions.Configuration.Edit)]
    [InlineData(typeof(MqttConfigsController), Permissions.Configuration.Edit)]
    [InlineData(typeof(CommunicationConfigsController), Permissions.Configuration.Edit)]
    [InlineData(typeof(HistoryProfilesController), Permissions.Configuration.Edit)]
    [InlineData(typeof(TagHistoryConfigsController), Permissions.Configuration.Edit)]
    [InlineData(typeof(LicensesController), Permissions.SystemAdministration.Manage)]
    public void SensitiveControllers_RequirePermissionPolicy(Type controllerType, string expectedPolicy)
    {
        var attr = controllerType.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .Cast<AuthorizeAttribute>()
            .Single();
        Assert.Equal(expectedPolicy, attr.Policy);
    }

    [Theory]
    [InlineData(typeof(StationsController))]
    [InlineData(typeof(PlcsController))]
    [InlineData(typeof(DevicesController))]
    [InlineData(typeof(TagsController))]
    [InlineData(typeof(SessionPolicyController))]
    [InlineData(typeof(AlarmHistoriesController))]
    [InlineData(typeof(EventLogsController))]
    [InlineData(typeof(ScadaRealtimeHub))]
    public void OperationalControllers_RequireAuthentication(Type type)
    {
        Assert.Contains(
            type.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true).Cast<AuthorizeAttribute>(),
            a => !string.IsNullOrEmpty(a.Policy) || a.Roles is null || a.Roles.Length == 0);
    }

    [Fact]
    public void SessionPolicy_Put_RequiresSystemAdministration()
    {
        var method = typeof(SessionPolicyController).GetMethod(nameof(SessionPolicyController.Update))!;
        var attr = method.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .Cast<AuthorizeAttribute>()
            .Single();
        Assert.Equal(Permissions.SystemAdministration.Manage, attr.Policy);
    }

    [Fact]
    public void Stations_Put_RequiresConfigurationEdit()
    {
        var method = typeof(StationsController).GetMethod(nameof(StationsController.Update))!;
        var attr = method.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .Cast<AuthorizeAttribute>()
            .Single();
        Assert.Equal(Permissions.Configuration.Edit, attr.Policy);
    }

    [Fact]
    public void AuditActionNames_UserAndStationActions_Exist()
    {
        Assert.Equal("CreateUser", AuditActionNames.CreateUser);
        Assert.Equal("UpdateUser", AuditActionNames.UpdateUser);
        Assert.Equal("DeactivateUser", AuditActionNames.DeactivateUser);
        Assert.Equal("UpdateStation", AuditActionNames.UpdateStation);
        Assert.Equal("Export", AuditActionNames.Export);
    }
}

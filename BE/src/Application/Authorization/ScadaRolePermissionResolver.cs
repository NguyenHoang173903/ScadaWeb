using Backend.Shared.Constants;

namespace Backend.Application.Authorization;

/// <summary>
/// Single source of truth: SCADA role string → canonical role + permission set.
/// No DB lookup — permissions are code-defined for the four business roles.
/// Legacy values (<c>Viewer</c>/<c>Operator</c>/<c>Admin</c>) are accepted without migration.
/// </summary>
public static class ScadaRolePermissionResolver
{
    private static readonly string[] ViewPermissions =
    [
        Permissions.Realtime.View
    ];

    private static readonly string[] OperatorPermissions =
    [
        Permissions.Realtime.View,
        Permissions.Trend.View,
        Permissions.History.View,
        Permissions.Report.View,
        Permissions.Report.Export,
        Permissions.Alarm.Acknowledge
    ];

    private static readonly string[] TechnicalPermissions =
    [
        Permissions.Realtime.View,
        Permissions.Trend.View,
        Permissions.History.View,
        Permissions.Report.View,
        Permissions.Report.Export,
        Permissions.Alarm.Acknowledge,
        Permissions.Technical.View,
        Permissions.Technical.Edit,
        Permissions.Configuration.View,
        Permissions.Configuration.Edit
    ];

    private static readonly string[] AdminPermissions =
    [
        Permissions.Realtime.View,
        Permissions.Trend.View,
        Permissions.History.View,
        Permissions.Report.View,
        Permissions.Report.Export,
        Permissions.Alarm.Acknowledge,
        Permissions.Technical.View,
        Permissions.Technical.Edit,
        Permissions.Configuration.View,
        Permissions.Configuration.Edit,
        Permissions.UserManagement.View,
        Permissions.UserManagement.Edit,
        Permissions.RoleManagement.View,
        Permissions.RoleManagement.Manage,
        Permissions.SystemAdministration.View,
        Permissions.SystemAdministration.Manage,
        // IAM controllers still use these policy names — ADMIN must satisfy them.
        Permissions.Users.View,
        Permissions.Users.Create,
        Permissions.Users.Update,
        Permissions.Users.Delete,
        Permissions.Roles.View,
        Permissions.Roles.Manage,
        Permissions.Reports.View
    ];

    /// <summary>
    /// Maps stored/API role aliases to canonical <see cref="ScadaRoles"/> values.
    /// Returns null for empty input when <paramref name="allowEmptyAsOperator"/> is false and role unknown.
    /// </summary>
    public static string? TryNormalize(string? raw, bool allowEmptyAsOperator = false)
    {
        var role = (raw ?? string.Empty).Trim();
        if (role.Length == 0)
            return allowEmptyAsOperator ? ScadaRoles.Operator : null;

        if (role.Equals(ScadaRoles.View, StringComparison.OrdinalIgnoreCase)
            || role.Equals("viewer", StringComparison.OrdinalIgnoreCase)
            || role.Equals("view", StringComparison.OrdinalIgnoreCase))
            return ScadaRoles.View;

        if (role.Equals(ScadaRoles.Operator, StringComparison.OrdinalIgnoreCase)
            || role.Equals("operator", StringComparison.OrdinalIgnoreCase))
            return ScadaRoles.Operator;

        if (role.Equals(ScadaRoles.Technical, StringComparison.OrdinalIgnoreCase)
            || role.Equals("technical", StringComparison.OrdinalIgnoreCase)
            || role.Equals("technician", StringComparison.OrdinalIgnoreCase)
            || role.Equals("engineer", StringComparison.OrdinalIgnoreCase))
            return ScadaRoles.Technical;

        if (role.Equals(ScadaRoles.Admin, StringComparison.OrdinalIgnoreCase)
            || role.Equals("admin", StringComparison.OrdinalIgnoreCase)
            || role.Equals("administrator", StringComparison.OrdinalIgnoreCase)
            || role.Equals(Roles.SuperAdmin, StringComparison.OrdinalIgnoreCase))
            return ScadaRoles.Admin;

        return null;
    }

    /// <summary>
    /// Canonical role for JWT/API responses. Unknown legacy strings stay as-is
    /// (no elevated permissions) so existing free-form values do not break login.
    /// </summary>
    public static string ResolveCanonicalRole(string? raw) =>
        TryNormalize(raw) ?? (raw ?? string.Empty).Trim();

    public static bool IsKnownRole(string? raw) => TryNormalize(raw) is not null;

    public static IReadOnlyList<string> ResolvePermissions(string? raw)
    {
        var canonical = TryNormalize(raw);
        return canonical switch
        {
            ScadaRoles.View => ViewPermissions,
            ScadaRoles.Operator => OperatorPermissions,
            ScadaRoles.Technical => TechnicalPermissions,
            ScadaRoles.Admin => AdminPermissions,
            _ => Array.Empty<string>()
        };
    }

    public static bool HasPermission(string? role, string permission) =>
        ResolvePermissions(role).Contains(permission, StringComparer.Ordinal);
}

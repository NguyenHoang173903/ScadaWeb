namespace Backend.Shared.Constants;

/// <summary>
/// Well-known role names. Kept as plain constants (not an enum) because roles are
/// data-driven (stored in the Roles table) and new ones can be added without a
/// code change; these constants only cover the roles the system relies on internally.
/// </summary>
public static class Roles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string Admin = "Admin";
    public const string Manager = "Manager";
    public const string User = "User";
}

/// <summary>
/// SCADA business roles stored on <c>public.Users.Role</c> (JWT role claim).
/// Canonical values: VIEW / OPERATOR / TECHNICAL / ADMIN.
/// Legacy DB values (Viewer/Operator/Admin) are normalized at login — no migration required.
/// Distinct from IAM <see cref="Roles"/> used by app.Users.
/// </summary>
public static class ScadaRoles
{
    public const string View = "VIEW";
    public const string Operator = "OPERATOR";
    public const string Technical = "TECHNICAL";
    public const string Admin = "ADMIN";

    /// <summary>Legacy alias kept for older call sites; same as <see cref="View"/>.</summary>
    public const string Viewer = View;

    /// <summary>Comma-separated for <c>[Authorize(Roles = ...)]</c> — SCADA Admin only.</summary>
    public const string AdminOnly = Admin;

    /// <summary>SCADA Admin + IAM SuperAdmin (when same JWT role pipeline).</summary>
    public const string Admins = Admin + "," + Roles.SuperAdmin;

    /// <summary>Operator and above (ack/export style actions).</summary>
    public const string OperatorAndAbove = Operator + "," + Technical + "," + Admin;

    /// <summary>Technical and Admin.</summary>
    public const string TechnicalAndAbove = Technical + "," + Admin;
}

/// <summary>
/// Fine-grained permission keys used by <c>[Authorize(Policy = "...")]</c>.
/// Format: "{Module}.{Action}". SCADA RBAC + legacy IAM keys.
/// </summary>
public static class Permissions
{
    public static class Realtime
    {
        public const string View = "Realtime.View";
    }

    public static class Trend
    {
        public const string View = "Trend.View";
    }

    public static class History
    {
        public const string View = "History.View";
    }

    public static class Report
    {
        public const string View = "Report.View";
        public const string Export = "Report.Export";
    }

    public static class Alarm
    {
        public const string Acknowledge = "Alarm.Acknowledge";
    }

    public static class Technical
    {
        public const string View = "Technical.View";
        public const string Edit = "Technical.Edit";
    }

    public static class Configuration
    {
        public const string View = "Configuration.View";
        public const string Edit = "Configuration.Edit";
    }

    public static class UserManagement
    {
        public const string View = "UserManagement.View";
        public const string Edit = "UserManagement.Edit";
    }

    public static class RoleManagement
    {
        public const string View = "RoleManagement.View";
        public const string Manage = "RoleManagement.Manage";
    }

    public static class SystemAdministration
    {
        public const string View = "SystemAdministration.View";
        public const string Manage = "SystemAdministration.Manage";
    }

    public static class Users
    {
        public const string View = "Users.View";
        public const string Create = "Users.Create";
        public const string Update = "Users.Update";
        public const string Delete = "Users.Delete";
    }

    public static class Roles
    {
        public const string View = "Roles.View";
        public const string Manage = "Roles.Manage";
    }

    public static class Reports
    {
        public const string View = "Reports.View";
    }

    /// <summary>All SCADA policies registered at startup (excluding legacy IAM duplicates already listed).</summary>
    public static IReadOnlyList<string> AllScadaPolicies { get; } =
    [
        Realtime.View,
        Trend.View,
        History.View,
        Report.View,
        Report.Export,
        Alarm.Acknowledge,
        Technical.View,
        Technical.Edit,
        Configuration.View,
        Configuration.Edit,
        UserManagement.View,
        UserManagement.Edit,
        RoleManagement.View,
        RoleManagement.Manage,
        SystemAdministration.View,
        SystemAdministration.Manage
    ];
}

/// <summary>Custom JWT claim types used in addition to the standard <see cref="System.Security.Claims.ClaimTypes"/>.</summary>
public static class ClaimTypesExtended
{
    public const string Permission = "permission";
    public const string UserId = "uid";
    public const string TokenVersion = "tv";
    public const string SessionId = "sid";
}

public static class PolicyNames
{
    public const string RequireAdmin = "RequireAdmin";
}

/// <summary>Security-related tuning values (token lifetimes, hashing cost, lockout policy).</summary>
public static class SecurityConstants
{
    public const int PasswordMinLength = 8;

    /// <summary>Upper bound on any submitted password (T4.4 §15) — guards against
    /// oversized-payload / expensive-hash (Argon2) denial-of-service.</summary>
    public const int PasswordMaxLength = 128;

    public const int BCryptWorkFactor = 12;
    public const int MaxFailedLoginAttempts = 5;
    public const int LockoutDurationMinutes = 15;
    public const int AccessTokenDefaultExpirationMinutes = 15;
    public const int RefreshTokenDefaultExpirationDays = 7;
    public const string CorrelationIdHeaderName = "X-Correlation-Id";
}

namespace Backend.Application.DTOs.Scada;

public class UpdateAppSettingRequest
{
    /// <summary>Raw setting value (validated against AppSettingCatalog).</summary>
    public string? SettingValue { get; set; }

    public bool? IsEnable { get; set; }
}

public class UpdatePasswordPolicyRequest
{
    public int MinLength { get; set; }
    public int MaxLength { get; set; }
    public bool RequireUppercase { get; set; }
    public bool RequireLowercase { get; set; }
    public bool RequireNumber { get; set; }
    public bool RequireSpecial { get; set; }
    public int ChangeIntervalDays { get; set; }
    public int ValidityDays { get; set; }
    public int MaxFailedLogins { get; set; }
    public int FailedLoginWindowMinutes { get; set; }
    public int LoginLockoutMinutes { get; set; }
}

public class UpdateFrontendConfigRequest
{
    public string? ArcgisApiKey { get; set; }
    public bool? LoginLayerVisible { get; set; }
}

public class AppSettingCatalogItemDto
{
    public string Key { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public bool EditableViaApi { get; set; }
    public string? DefaultValue { get; set; }
    public double? Min { get; set; }
    public double? Max { get; set; }
}

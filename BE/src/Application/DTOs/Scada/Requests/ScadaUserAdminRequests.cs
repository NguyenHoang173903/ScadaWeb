namespace Backend.Application.DTOs.Scada;

/// <summary>Admin cấp lại mật khẩu cho user (quên mật khẩu).</summary>
public class AdminResetScadaUserPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
    public string? ConfirmPassword { get; set; }

    /// <summary>Bắt user đổi mật khẩu ở lần đăng nhập tiếp theo (mặc định bật).</summary>
    public bool MustChangePassword { get; set; } = true;
}

/// <summary>Kết quả kiểm tra tên đăng nhập khi đang nhập form Thêm người dùng.</summary>
public class UsernameAvailabilityDto
{
    public string Username { get; set; } = string.Empty;
    public bool IsValid { get; set; }
    public bool IsAvailable { get; set; }
    public string? Message { get; set; }
}

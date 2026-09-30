using Backend.Application.Common;
using Backend.Application.DTOs.Auth;
using Backend.Application.Options;
using Backend.Shared.Constants;
using Backend.Shared.Extensions;
using FluentValidation;
using Microsoft.Extensions.Options;

namespace Backend.Application.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator(IOptions<PasswordPolicyOptions> passwordOptions)
    {
        var opt = passwordOptions.Value;
        var min = opt.MinLength > 0 ? opt.MinLength : PasswordComplexity.DefaultMinLength;
        var max = opt.MaxLength > 0 ? opt.MaxLength : PasswordComplexity.DefaultMaxLength;

        RuleFor(x => x.Username).NotEmpty()
            .WithMessage("Vui lòng nhập tên đăng nhập.")
            .MaximumLength(ValidationConstants.UsernameMaxLength)
            .WithMessage($"Tên đăng nhập được phép có tối đa {ValidationConstants.UsernameMaxLength} ký tự.")
            .Must(u => u.IsSafeIdentifier())
            .WithMessage("Tên đăng nhập chỉ được gồm chữ cái, chữ số, dấu chấm, dấu gạch dưới và dấu gạch ngang.");
        RuleFor(x => x.FullName)
            .Must((req, _) => !string.IsNullOrWhiteSpace(req.FullName) || !string.IsNullOrWhiteSpace(req.DisplayName))
            .WithMessage("Vui lòng nhập họ và tên.")
            .Must((req, _) =>
            {
                var name = string.IsNullOrWhiteSpace(req.FullName) ? req.DisplayName : req.FullName;
                return name.Length <= ValidationConstants.DisplayNameMaxLength;
            })
            .WithMessage($"Họ và tên được phép có tối đa {ValidationConstants.DisplayNameMaxLength} ký tự.")
            .Must((req, _) =>
            {
                var name = string.IsNullOrWhiteSpace(req.FullName) ? req.DisplayName : req.FullName;
                return string.IsNullOrEmpty(name) || !name.ContainsDisallowedControlChars();
            })
            .WithMessage("Họ và tên chứa ký tự không hợp lệ.");
        RuleFor(x => x.Password).NotEmpty()
            .WithMessage("Vui lòng nhập mật khẩu.")
            .Must(p => PasswordComplexity.TryValidate(
                p, min, max, opt.RequireUppercase, opt.RequireLowercase, opt.RequireDigit, opt.RequireSpecial, out _))
            .WithMessage($"Mật khẩu phải có từ {min} đến {max} ký tự và đáp ứng các yêu cầu về chữ hoa, chữ thường, chữ số, ký tự đặc biệt.");
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        // T4.4 §9 / T5 — bound username; NEVER trim/complexity the password.
        RuleFor(x => x.Username).NotEmpty()
            .WithMessage("Vui lòng nhập tên đăng nhập.")
            .MaximumLength(ValidationConstants.UsernameMaxLength)
            .WithMessage($"Tên đăng nhập được phép có tối đa {ValidationConstants.UsernameMaxLength} ký tự.")
            .Must(u => u.IsSafeIdentifier())
            .WithMessage("Tên đăng nhập chỉ được gồm chữ cái, chữ số, dấu chấm, dấu gạch dưới và dấu gạch ngang.");
        RuleFor(x => x.Password).NotEmpty()
            .WithMessage("Vui lòng nhập mật khẩu.")
            .MaximumLength(SecurityConstants.PasswordMaxLength)
            .WithMessage($"Mật khẩu được phép có tối đa {SecurityConstants.PasswordMaxLength} ký tự.");
    }
}

public class RefreshRequestValidator : AbstractValidator<RefreshRequest>
{
    public RefreshRequestValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty()
            .WithMessage("Phiên đăng nhập không hợp lệ.")
            .MaximumLength(ValidationConstants.TokenMaxLength)
            .WithMessage("Phiên đăng nhập không hợp lệ.");
    }
}

public class LogoutRequestValidator : AbstractValidator<LogoutRequest>
{
    public LogoutRequestValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty()
            .WithMessage("Phiên đăng nhập không hợp lệ.")
            .MaximumLength(ValidationConstants.TokenMaxLength)
            .WithMessage("Phiên đăng nhập không hợp lệ.");
        RuleFor(x => x.SessionId)
            .MaximumLength(64)
            .Must(v => v is null || !v.ContainsDisallowedControlChars())
            .WithMessage("Mã phiên đăng nhập chứa ký tự không hợp lệ.")
            .When(x => !string.IsNullOrEmpty(x.SessionId));
    }
}

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator(IOptions<PasswordPolicyOptions> passwordOptions)
    {
        var opt = passwordOptions.Value;
        var min = opt.MinLength > 0 ? opt.MinLength : PasswordComplexity.DefaultMinLength;
        var max = opt.MaxLength > 0 ? opt.MaxLength : PasswordComplexity.DefaultMaxLength;

        RuleFor(x => x.CurrentPassword).NotEmpty()
            .WithMessage("Vui lòng nhập mật khẩu hiện tại.")
            .MaximumLength(SecurityConstants.PasswordMaxLength)
            .WithMessage($"Mật khẩu hiện tại được phép có tối đa {SecurityConstants.PasswordMaxLength} ký tự.");
        RuleFor(x => x.NewPassword).NotEmpty()
            .WithMessage("Vui lòng nhập mật khẩu mới.")
            .Must(p => PasswordComplexity.TryValidate(
                p, min, max, opt.RequireUppercase, opt.RequireLowercase, opt.RequireDigit, opt.RequireSpecial, out _))
            .WithMessage($"Mật khẩu phải có từ {min} đến {max} ký tự và đáp ứng các yêu cầu về chữ hoa, chữ thường, chữ số, ký tự đặc biệt.")
            .NotEqual(x => x.CurrentPassword)
            .WithMessage("Mật khẩu mới phải khác mật khẩu hiện tại.");
    }
}

public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Username).NotEmpty()
            .WithMessage("Vui lòng nhập tên đăng nhập.")
            .MaximumLength(ValidationConstants.UsernameMaxLength)
            .WithMessage($"Tên đăng nhập được phép có tối đa {ValidationConstants.UsernameMaxLength} ký tự.")
            .Must(u => u.IsSafeIdentifier())
            .WithMessage("Tên đăng nhập chỉ được gồm chữ cái, chữ số, dấu chấm, dấu gạch dưới và dấu gạch ngang.");
    }
}

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator(IOptions<PasswordPolicyOptions> passwordOptions)
    {
        var opt = passwordOptions.Value;
        var min = opt.MinLength > 0 ? opt.MinLength : PasswordComplexity.DefaultMinLength;
        var max = opt.MaxLength > 0 ? opt.MaxLength : PasswordComplexity.DefaultMaxLength;

        RuleFor(x => x.Token).NotEmpty()
            .WithMessage("Liên kết đặt lại mật khẩu không hợp lệ.")
            .MaximumLength(ValidationConstants.TokenMaxLength)
            .WithMessage("Liên kết đặt lại mật khẩu không hợp lệ.");
        RuleFor(x => x.NewPassword).NotEmpty()
            .WithMessage("Vui lòng nhập mật khẩu mới.")
            .Must(p => PasswordComplexity.TryValidate(
                p, min, max, opt.RequireUppercase, opt.RequireLowercase, opt.RequireDigit, opt.RequireSpecial, out _))
            .WithMessage($"Mật khẩu phải có từ {min} đến {max} ký tự và đáp ứng các yêu cầu về chữ hoa, chữ thường, chữ số, ký tự đặc biệt.");
    }
}

// --- Legacy IAM DTOs (app.Users) — kept while IAuthService remains registered ---

public class RegisterValidator : AbstractValidator<RegisterDto>
{
    public RegisterValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(ValidationConstants.EmailMaxLength);
        RuleFor(x => x.FirstName).NotEmpty()
            .MaximumLength(ValidationConstants.NameMaxLength)
            .Must(v => !v.ContainsDisallowedControlChars())
            .WithMessage("Tên chứa ký tự không hợp lệ.");
        RuleFor(x => x.LastName).NotEmpty()
            .MaximumLength(ValidationConstants.NameMaxLength)
            .Must(v => !v.ContainsDisallowedControlChars())
            .WithMessage("Họ chứa ký tự không hợp lệ.");
        RuleFor(x => x.Password).NotEmpty()
            .MinimumLength(SecurityConstants.PasswordMinLength)
            .MaximumLength(SecurityConstants.PasswordMaxLength);
    }
}

public class LoginValidator : AbstractValidator<LoginDto>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(ValidationConstants.EmailMaxLength);
        RuleFor(x => x.Password).NotEmpty().MaximumLength(SecurityConstants.PasswordMaxLength);
    }
}

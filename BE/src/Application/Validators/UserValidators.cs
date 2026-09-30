using Backend.Application.DTOs.Users;
using Backend.Shared.Constants;
using Backend.Shared.Extensions;
using FluentValidation;

namespace Backend.Application.Validators;

public class CreateUserValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserValidator()
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
        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(SecurityConstants.PasswordMinLength)
            .MaximumLength(SecurityConstants.PasswordMaxLength)
            .Matches("[A-Z]").WithMessage("Mật khẩu phải có ít nhất một chữ cái viết hoa.")
            .Matches("[a-z]").WithMessage("Mật khẩu phải có ít nhất một chữ cái viết thường.")
            .Matches("[0-9]").WithMessage("Mật khẩu phải có ít nhất một chữ số.");
        RuleFor(x => x.PhoneNumber)
            .MaximumLength(ValidationConstants.PhoneNumberMaxLength)
            .Must(v => v is null || !v.ContainsDisallowedControlChars())
            .WithMessage("Số điện thoại chứa ký tự không hợp lệ.")
            .When(x => !string.IsNullOrEmpty(x.PhoneNumber));
    }
}

public class UpdateUserValidator : AbstractValidator<UpdateUserDto>
{
    public UpdateUserValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty()
            .MaximumLength(ValidationConstants.NameMaxLength)
            .Must(v => !v.ContainsDisallowedControlChars())
            .WithMessage("Tên chứa ký tự không hợp lệ.");
        RuleFor(x => x.LastName).NotEmpty()
            .MaximumLength(ValidationConstants.NameMaxLength)
            .Must(v => !v.ContainsDisallowedControlChars())
            .WithMessage("Họ chứa ký tự không hợp lệ.");
        RuleFor(x => x.PhoneNumber)
            .MaximumLength(ValidationConstants.PhoneNumberMaxLength)
            .Must(v => v is null || !v.ContainsDisallowedControlChars())
            .WithMessage("Số điện thoại chứa ký tự không hợp lệ.")
            .When(x => !string.IsNullOrEmpty(x.PhoneNumber));
    }
}

public class ChangePasswordValidator : AbstractValidator<ChangePasswordDto>
{
    public ChangePasswordValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty().MaximumLength(SecurityConstants.PasswordMaxLength);
        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .MinimumLength(SecurityConstants.PasswordMinLength)
            .MaximumLength(SecurityConstants.PasswordMaxLength)
            .NotEqual(x => x.CurrentPassword).WithMessage("Mật khẩu mới phải khác mật khẩu hiện tại.");
    }
}

public class UserSearchQueryValidator : AbstractValidator<UserSearchQuery>
{
    public UserSearchQueryValidator()
    {
        RuleFor(x => x.Keyword)
            .MaximumLength(ValidationConstants.KeywordMaxLength)
            .Must(v => v is null || !v.ContainsDisallowedControlChars())
            .WithMessage("Từ khóa chứa ký tự không hợp lệ.")
            .When(x => !string.IsNullOrEmpty(x.Keyword));
    }
}

public class DeactivateUserQueryValidator : AbstractValidator<DeactivateUserQuery>
{
    public DeactivateUserQueryValidator()
    {
        RuleFor(x => x.Reason)
            .MaximumLength(ValidationConstants.ReasonMaxLength)
            .Must(v => v is null || !v.ContainsDisallowedControlChars(allowNewLineAndTab: true))
            .WithMessage("Lý do chứa ký tự không hợp lệ.")
            .When(x => !string.IsNullOrEmpty(x.Reason));
    }
}

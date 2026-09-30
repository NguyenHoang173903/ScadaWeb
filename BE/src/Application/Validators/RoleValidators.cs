using Backend.Application.DTOs.Roles;
using Backend.Shared.Constants;
using Backend.Shared.Extensions;
using FluentValidation;

namespace Backend.Application.Validators;

public class CreateRoleValidator : AbstractValidator<CreateRoleDto>
{
    public CreateRoleValidator()
    {
        RuleFor(x => x.Name).NotEmpty()
            .MaximumLength(ValidationConstants.NameMaxLength)
            .Must(v => !v.ContainsDisallowedControlChars())
            .WithMessage("Tên vai trò chứa ký tự không hợp lệ.");
        RuleFor(x => x.Description)
            .MaximumLength(ValidationConstants.DescriptionMaxLength)
            .Must(v => v is null || !v.ContainsDisallowedControlChars(allowNewLineAndTab: true))
            .WithMessage("Mô tả chứa ký tự không hợp lệ.")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}

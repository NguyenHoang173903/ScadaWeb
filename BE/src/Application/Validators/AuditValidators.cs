using Backend.Application.DTOs.Audit;
using Backend.Shared.Constants;
using Backend.Shared.Extensions;
using FluentValidation;

namespace Backend.Application.Validators;

/// <summary>
/// T4.4 / T5 — strongly-typed validation for the System Audit Log search query.
/// EventType/Status are enums (model binding rejects invalid values with 400);
/// SortBy is whitelisted server-side; PageSize is clamped by <c>PaginationRequest</c>.
/// </summary>
public class SystemAuditLogQueryValidator : AbstractValidator<SystemAuditLogQuery>
{
    public SystemAuditLogQueryValidator()
    {
        RuleFor(x => x.ToUtc)
            .GreaterThanOrEqualTo(x => x.FromUtc!.Value)
            .When(x => x.FromUtc.HasValue && x.ToUtc.HasValue)
            .WithMessage("Thời gian kết thúc phải lớn hơn hoặc bằng thời gian bắt đầu.");

        RuleFor(x => x.UserName)
            .MaximumLength(ValidationConstants.UsernameMaxLength)
            .Must(v => v is null || !v.ContainsDisallowedControlChars())
            .WithMessage("Tên người dùng chứa ký tự không hợp lệ.")
            .When(x => !string.IsNullOrEmpty(x.UserName));

        RuleFor(x => x.Action)
            .MaximumLength(100)
            .Must(v => v is null || !v.ContainsDisallowedControlChars())
            .WithMessage("Hành động chứa ký tự không hợp lệ.")
            .When(x => !string.IsNullOrEmpty(x.Action));

        RuleFor(x => x.Keyword)
            .MaximumLength(ValidationConstants.KeywordMaxLength)
            .Must(v => v is null || !v.ContainsDisallowedControlChars())
            .WithMessage("Từ khóa chứa ký tự không hợp lệ.")
            .When(x => !string.IsNullOrEmpty(x.Keyword));
    }
}

/// <summary>T5 — bounds free-text filters on the legacy <c>app.AuditLogs</c> query API.</summary>
public class AuditLogQueryValidator : AbstractValidator<AuditLogQuery>
{
    public AuditLogQueryValidator()
    {
        RuleFor(x => x.ToUtc)
            .GreaterThanOrEqualTo(x => x.FromUtc!.Value)
            .When(x => x.FromUtc.HasValue && x.ToUtc.HasValue)
            .WithMessage("Thời gian kết thúc phải lớn hơn hoặc bằng thời gian bắt đầu.");

        RuleFor(x => x.EntityName)
            .MaximumLength(ValidationConstants.NameMaxLength)
            .Must(v => v is null || !v.ContainsDisallowedControlChars())
            .WithMessage("Tên đối tượng chứa ký tự không hợp lệ.")
            .When(x => !string.IsNullOrEmpty(x.EntityName));

        RuleFor(x => x.EntityId)
            .MaximumLength(ValidationConstants.NameMaxLength)
            .Must(v => v is null || !v.ContainsDisallowedControlChars())
            .WithMessage("Mã đối tượng chứa ký tự không hợp lệ.")
            .When(x => !string.IsNullOrEmpty(x.EntityId));

        RuleFor(x => x.UserId)
            .MaximumLength(ValidationConstants.AuditUserMaxLength)
            .Must(v => v is null || !v.ContainsDisallowedControlChars())
            .WithMessage("Mã người dùng chứa ký tự không hợp lệ.")
            .When(x => !string.IsNullOrEmpty(x.UserId));

        RuleFor(x => x.Keyword)
            .MaximumLength(ValidationConstants.KeywordMaxLength)
            .Must(v => v is null || !v.ContainsDisallowedControlChars())
            .WithMessage("Từ khóa chứa ký tự không hợp lệ.")
            .When(x => !string.IsNullOrEmpty(x.Keyword));
    }
}

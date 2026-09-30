using Backend.Application.Authorization;
using Backend.Application.DTOs.Scada;
using Backend.Shared.Constants;
using FluentValidation;

namespace Backend.Application.Validators;

public class UpdateScadaUserRequestValidator : AbstractValidator<UpdateScadaUserRequest>
{
    public UpdateScadaUserRequestValidator()
    {
        RuleFor(x => x.FullName)
            .MaximumLength(ValidationConstants.DisplayNameMaxLength)
            .WithMessage($"Họ và tên được phép có tối đa {ValidationConstants.DisplayNameMaxLength} ký tự.")
            .When(x => x.FullName is not null);

        RuleFor(x => x.Email)
            .EmailAddress()
            .WithMessage("Email không đúng định dạng.")
            .MaximumLength(ValidationConstants.EmailMaxLength)
            .WithMessage($"Email được phép có tối đa {ValidationConstants.EmailMaxLength} ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.Department).MaximumLength(200)
            .WithMessage("Phòng ban được phép có tối đa 200 ký tự.").When(x => x.Department is not null);
        RuleFor(x => x.Position).MaximumLength(200)
            .WithMessage("Chức vụ được phép có tối đa 200 ký tự.").When(x => x.Position is not null);
        RuleFor(x => x.Unit).MaximumLength(200)
            .WithMessage("Đơn vị được phép có tối đa 200 ký tự.").When(x => x.Unit is not null);
        RuleFor(x => x.Description).MaximumLength(ValidationConstants.DescriptionMaxLength)
            .WithMessage($"Mô tả được phép có tối đa {ValidationConstants.DescriptionMaxLength} ký tự.")
            .When(x => x.Description is not null);

        RuleFor(x => x.Level)
            .InclusiveBetween(1, 100)
            .WithMessage("Cấp độ phải nằm trong khoảng từ 1 đến 100.")
            .When(x => x.Level is not null);

        RuleFor(x => x.Role)
            .Must(r => r is null || ScadaRolePermissionResolver.IsKnownRole(r))
            .WithMessage("Vai trò phải là Người xem, Vận hành, Kỹ thuật hoặc Quản trị viên.")
            .When(x => x.Role is not null);
    }
}

public class UpdateStationRequestValidator : AbstractValidator<UpdateStationRequest>
{
    public UpdateStationRequestValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(200)
            .WithMessage("Tên trạm được phép có tối đa 200 ký tự.")
            .When(x => x.Name is not null);

        RuleFor(x => x.Address).MaximumLength(500)
            .WithMessage("Địa chỉ được phép có tối đa 500 ký tự.").When(x => x.Address is not null);
        RuleFor(x => x.Description).MaximumLength(ValidationConstants.DescriptionMaxLength)
            .WithMessage($"Mô tả được phép có tối đa {ValidationConstants.DescriptionMaxLength} ký tự.")
            .When(x => x.Description is not null);

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90)
            .WithMessage("Vĩ độ phải nằm trong khoảng từ -90 đến 90.")
            .When(x => x.Latitude is not null);

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180)
            .WithMessage("Kinh độ phải nằm trong khoảng từ -180 đến 180.")
            .When(x => x.Longitude is not null);
    }
}

public class UpdateSessionPolicyRequestValidator : AbstractValidator<UpdateSessionPolicyRequest>
{
    public UpdateSessionPolicyRequestValidator()
    {
        RuleFor(x => x.IdleTimeoutMinutes)
            .InclusiveBetween(1, 10080)
            .WithMessage("Thời gian chờ phải nằm trong khoảng từ 1 đến 10080 phút (7 ngày).");
    }
}

using Backend.Api.Middlewares;
using Backend.Application.DTOs.Scada;
using Backend.Application.Interfaces.Services.Scada;
using Backend.Shared.Constants;
using Backend.Shared.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers.Scada;

[ApiController]
[Route("api/v1/password-policy")]
[Produces("application/json")]
[Authorize]
public class PasswordPolicyController(IAppSettingQueryService settings) : ControllerBase
{
    /// <summary>Mọi user đã đăng nhập (kể cả đang bị buộc đổi mật khẩu) cần đọc rule để validate form đổi mật khẩu.</summary>
    [HttpGet]
    [AllowWhenPasswordChangeRequired]
    [ProducesResponseType(typeof(ApiResponse<PasswordPolicyDto>), ScadaHttpStatuses.Ok)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken) =>
        this.ToActionResult(
            await settings.GetPasswordPolicyAsync(cancellationToken),
            "Chính sách mật khẩu.");

    [HttpPut]
    [Authorize(Policy = Permissions.SystemAdministration.Manage)]
    [ProducesResponseType(typeof(ApiResponse<PasswordPolicyDto>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<PasswordPolicyDto>), ScadaHttpStatuses.BadRequest)]
    public async Task<IActionResult> Update(
        [FromBody] UpdatePasswordPolicyRequest request,
        CancellationToken cancellationToken) =>
        this.ToActionResult(
            await settings.UpdatePasswordPolicyAsync(request, cancellationToken),
            "Đã lưu chính sách mật khẩu.");
}

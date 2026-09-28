using Backend.Application.DTOs.Scada;
using Backend.Application.Interfaces.Services.Scada;
using Backend.Shared.Constants;
using Backend.Shared.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers.Scada;

[ApiController]
[Route("api/v1/frontend-config")]
[Produces("application/json")]
public class FrontendConfigController(IAppSettingQueryService settings) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<FrontendConfigDto>), ScadaHttpStatuses.Ok)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken) =>
        this.ToActionResult(
            await settings.GetFrontendConfigAsync(cancellationToken),
            "Cấu hình frontend.");

    [HttpPut]
    [Authorize(Policy = Permissions.SystemAdministration.Manage)]
    [ProducesResponseType(typeof(ApiResponse<FrontendConfigDto>), ScadaHttpStatuses.Ok)]
    public async Task<IActionResult> Update(
        [FromBody] UpdateFrontendConfigRequest request,
        CancellationToken cancellationToken) =>
        this.ToActionResult(
            await settings.UpdateFrontendConfigAsync(request, cancellationToken),
            "Đã lưu cấu hình frontend.");
}

using Backend.Application.DTOs.Scada;
using Backend.Application.Interfaces.Services.Scada;
using Backend.Shared.Constants;
using Backend.Shared.Helpers;
using Backend.Shared.Pagination;
using Backend.Shared.Responses;
using Backend.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers.Scada;

/// <summary>API trạm bơm (scada.station) + điện / sơ đồ / thẻ thiết bị / báo cáo / alarm / export.</summary>
[ApiController]
[Route("api/v1/stations")]
[Produces("application/json")]
[Authorize]
public class StationsController(IStationQueryService stations) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = Permissions.Realtime.View)]
    [ProducesResponseType(typeof(ApiResponse<PaginationResult<StationDto>>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<PaginationResult<StationDto>>), ScadaHttpStatuses.Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<PaginationResult<StationDto>>), ScadaHttpStatuses.InternalServerError)]
    public async Task<IActionResult> GetAll([FromQuery] StationQuery query, CancellationToken cancellationToken) =>
        this.ToActionResult(await stations.GetPagedAsync(query, cancellationToken), ScadaApiMessages.StationsListOk);

    [HttpGet("{id:long}")]
    [Authorize(Policy = Permissions.Realtime.View)]
    [ProducesResponseType(typeof(ApiResponse<StationDetailDto>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<StationDetailDto>), ScadaHttpStatuses.NotFound)]
    [ProducesResponseType(typeof(ApiResponse<StationDetailDto>), ScadaHttpStatuses.Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<StationDetailDto>), ScadaHttpStatuses.InternalServerError)]
    public async Task<IActionResult> GetById(long id, CancellationToken cancellationToken) =>
        this.ToActionResult(await stations.GetByIdAsync(id, cancellationToken), ScadaApiMessages.StationDetailOk);

    /// <summary>Cập nhật metadata trạm — Configuration.Edit (TECHNICAL+ / ADMIN).</summary>
    [HttpPut("{id:long}")]
    [Authorize(Policy = Permissions.Configuration.Edit)]
    [ProducesResponseType(typeof(ApiResponse<StationDetailDto>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<StationDetailDto>), ScadaHttpStatuses.BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<StationDetailDto>), ScadaHttpStatuses.NotFound)]
    [ProducesResponseType(typeof(ApiResponse<StationDetailDto>), ScadaHttpStatuses.Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<StationDetailDto>), ScadaHttpStatuses.Forbidden)]
    public async Task<IActionResult> Update(
        long id,
        [FromBody] UpdateStationRequest request,
        CancellationToken cancellationToken) =>
        this.ToActionResult(
            await stations.UpdateAsync(id, request, cancellationToken),
            ScadaApiMessages.StationUpdatedOk);

    [HttpGet("{stationId:long}/electrical")]
    [Authorize(Policy = Permissions.Realtime.View)]
    [ProducesResponseType(typeof(ApiResponse<StationElectricalDto>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<StationElectricalDto>), ScadaHttpStatuses.NotFound)]
    public async Task<IActionResult> GetElectrical(long stationId, [FromQuery] StationElectricalQuery query, CancellationToken cancellationToken) =>
        this.ToActionResult(await stations.GetElectricalAsync(stationId, query, cancellationToken), ScadaApiMessages.StationElectricalOk);

    [HttpGet("{stationId:long}/schematic")]
    [Authorize(Policy = Permissions.Realtime.View)]
    [ProducesResponseType(typeof(ApiResponse<StationSchematicDto>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<StationSchematicDto>), ScadaHttpStatuses.NotFound)]
    public async Task<IActionResult> GetSchematic(long stationId, CancellationToken cancellationToken) =>
        this.ToActionResult(await stations.GetSchematicAsync(stationId, cancellationToken), ScadaApiMessages.StationSchematicOk);

    [HttpGet("{stationId:long}/device-cards")]
    [Authorize(Policy = Permissions.Realtime.View)]
    [ProducesResponseType(typeof(ApiResponse<StationDeviceCardsDto>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<StationDeviceCardsDto>), ScadaHttpStatuses.NotFound)]
    public async Task<IActionResult> GetDeviceCards(long stationId, [FromQuery] StationDeviceCardsQuery query, CancellationToken cancellationToken) =>
        this.ToActionResult(await stations.GetDeviceCardsAsync(stationId, query, cancellationToken), ScadaApiMessages.StationDeviceCardsOk);

    [HttpGet("{stationId:long}/device-monitor")]
    [Authorize(Policy = Permissions.Realtime.View)]
    [ProducesResponseType(typeof(ApiResponse<StationDeviceMonitorDto>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<StationDeviceMonitorDto>), ScadaHttpStatuses.NotFound)]
    public async Task<IActionResult> GetDeviceMonitor(long stationId, [FromQuery] StationDeviceMonitorQuery query, CancellationToken cancellationToken) =>
        this.ToActionResult(await stations.GetDeviceMonitorAsync(stationId, query, cancellationToken), ScadaApiMessages.StationDeviceMonitorOk);

    [HttpGet("{stationId:long}/reports/devices")]
    [Authorize(Policy = Permissions.Report.View)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<StationReportDeviceOptionDto>>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<StationReportDeviceOptionDto>>), ScadaHttpStatuses.NotFound)]
    public async Task<IActionResult> GetReportDevices(long stationId, CancellationToken cancellationToken) =>
        this.ToActionResult(await stations.GetReportDeviceOptionsAsync(stationId, cancellationToken), ScadaApiMessages.StationReportDevicesOk);

    [HttpGet("{stationId:long}/reports/table")]
    [Authorize(Policy = Permissions.Report.View)]
    [ProducesResponseType(typeof(ApiResponse<StationReportTableDto>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<StationReportTableDto>), ScadaHttpStatuses.BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<StationReportTableDto>), ScadaHttpStatuses.NotFound)]
    public async Task<IActionResult> GetReportTable(
        long stationId,
        [FromQuery] StationReportTableQuery query,
        CancellationToken cancellationToken) =>
        this.ToActionResult(
            await stations.GetReportTableAsync(stationId, query, cancellationToken),
            ScadaApiMessages.StationReportTableOk);

    /// <summary>Xuất Excel bảng báo cáo (history_30m) theo thiết bị — tối đa 10_000 dòng.</summary>
    [HttpGet("{stationId:long}/reports/table/export")]
    [Authorize(Policy = Permissions.Report.Export)]
    [Produces(ApplicationConstants.ExcelContentType)]
    [ProducesResponseType(ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse), ScadaHttpStatuses.BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), ScadaHttpStatuses.Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), ScadaHttpStatuses.Forbidden)]
    public async Task<IActionResult> ExportReportTable(
        long stationId,
        [FromQuery] StationReportTableQuery query,
        CancellationToken cancellationToken)
    {
        var result = await stations.ExportReportTableExcelAsync(stationId, query, cancellationToken);
        var filePrefix = query.DeviceId > 0
            ? $"BaoCao_Device{query.DeviceId}"
            : "BaoCao";
        return ToExcelResult(result, filePrefix);
    }

    [HttpGet("{stationId:long}/events/devices")]
    [Authorize(Policy = Permissions.History.View)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<StationReportDeviceOptionDto>>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<StationReportDeviceOptionDto>>), ScadaHttpStatuses.NotFound)]
    public async Task<IActionResult> GetEventDevices(long stationId, CancellationToken cancellationToken) =>
        this.ToActionResult(
            await stations.GetEventDeviceOptionsAsync(stationId, cancellationToken),
            ScadaApiMessages.StationEventDevicesOk);

    [HttpGet("{stationId:long}/events/history")]
    [Authorize(Policy = Permissions.History.View)]
    [ProducesResponseType(typeof(ApiResponse<PaginationResult<StationEventHistoryRowDto>>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<PaginationResult<StationEventHistoryRowDto>>), ScadaHttpStatuses.BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<PaginationResult<StationEventHistoryRowDto>>), ScadaHttpStatuses.NotFound)]
    public async Task<IActionResult> GetEventHistory(
        long stationId,
        [FromQuery] StationEventHistoryQuery query,
        CancellationToken cancellationToken) =>
        this.ToActionResult(
            await stations.GetEventHistoryAsync(stationId, query, cancellationToken),
            ScadaApiMessages.StationEventHistoryOk);

    /// <summary>Xuất Excel lịch sử sự kiện theo trạm.</summary>
    [HttpGet("{stationId:long}/events/history/export")]
    [Authorize(Policy = Permissions.Report.Export)]
    [Produces(ApplicationConstants.ExcelContentType)]
    [ProducesResponseType(ScadaHttpStatuses.Ok)]
    public async Task<IActionResult> ExportEventHistory(
        long stationId,
        [FromQuery] StationEventHistoryQuery query,
        CancellationToken cancellationToken)
    {
        var result = await stations.ExportEventHistoryExcelAsync(stationId, query, cancellationToken);
        return ToExcelResult(result, "SuKien");
    }

    /// <summary>
    /// Alarm đang mở theo trạm — Redis <c>SCADA:{stationCode}:ALARM:{id}</c>.
    /// Active khi <c>EndTime</c> null hoặc <c>State=ACTIVE</c>.
    /// </summary>
    [HttpGet("{stationId:long}/alarms/active")]
    [Authorize(Policy = Permissions.Realtime.View)]
    [ProducesResponseType(typeof(ApiResponse<PaginationResult<ActiveAlarmRowDto>>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<PaginationResult<ActiveAlarmRowDto>>), ScadaHttpStatuses.NotFound)]
    public async Task<IActionResult> GetActiveAlarms(
        long stationId,
        [FromQuery] ActiveAlarmQuery query,
        CancellationToken cancellationToken) =>
        this.ToActionResult(
            await stations.GetActiveAlarmsAsync(stationId, query, cancellationToken),
            ScadaApiMessages.StationActiveAlarmsOk);

    [HttpGet("{stationId:long}/alarms/active/export")]
    [Authorize(Policy = Permissions.Report.Export)]
    [Produces(ApplicationConstants.ExcelContentType)]
    [ProducesResponseType(ScadaHttpStatuses.Ok)]
    public async Task<IActionResult> ExportActiveAlarms(
        long stationId,
        [FromQuery] ActiveAlarmQuery query,
        CancellationToken cancellationToken)
    {
        var result = await stations.ExportActiveAlarmsExcelAsync(stationId, query, cancellationToken);
        return ToExcelResult(result, "LoiTonTai");
    }

    /// <summary>Tổ vận hành — Redis <c>SCADA:{stationCode}:OPERATOR:{id}</c>.</summary>
    [HttpGet("{stationId:long}/team")]
    [Authorize(Policy = Permissions.Realtime.View)]
    [ProducesResponseType(typeof(ApiResponse<StationTeamDto>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<StationTeamDto>), ScadaHttpStatuses.NotFound)]
    public async Task<IActionResult> GetStationTeam(long stationId, CancellationToken cancellationToken) =>
        this.ToActionResult(
            await stations.GetStationTeamAsync(stationId, cancellationToken),
            ScadaApiMessages.StationTeamOk);

    [HttpGet("{stationId:long}/reports/water-levels")]
    [Authorize(Policy = Permissions.Report.View)]
    [ProducesResponseType(typeof(ApiResponse<PaginationResult<WaterLevelReportRowDto>>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<PaginationResult<WaterLevelReportRowDto>>), ScadaHttpStatuses.BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<PaginationResult<WaterLevelReportRowDto>>), ScadaHttpStatuses.NotFound)]
    public async Task<IActionResult> GetWaterLevelReport(long stationId, [FromQuery] StationWaterLevelReportQuery query, CancellationToken cancellationToken) =>
        this.ToActionResult(await stations.GetWaterLevelReportAsync(stationId, query, cancellationToken), ScadaApiMessages.StationWaterLevelReportOk);

    [HttpGet("{stationId:long}/reports/pump-temperatures")]
    [Authorize(Policy = Permissions.Report.View)]
    [ProducesResponseType(typeof(ApiResponse<PaginationResult<PumpTemperatureReportRowDto>>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<PaginationResult<PumpTemperatureReportRowDto>>), ScadaHttpStatuses.BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<PaginationResult<PumpTemperatureReportRowDto>>), ScadaHttpStatuses.NotFound)]
    public async Task<IActionResult> GetPumpTemperatureReport(long stationId, [FromQuery] StationPumpTemperatureReportQuery query, CancellationToken cancellationToken) =>
        this.ToActionResult(await stations.GetPumpTemperatureReportAsync(stationId, query, cancellationToken), ScadaApiMessages.StationPumpTemperatureReportOk);

    [HttpGet("{stationId:long}/charts/devices")]
    [Authorize(Policy = Permissions.Trend.View)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<StationChartDeviceOptionDto>>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<StationChartDeviceOptionDto>>), ScadaHttpStatuses.NotFound)]
    public async Task<IActionResult> GetChartDevices(long stationId, CancellationToken cancellationToken) =>
        this.ToActionResult(await stations.GetChartDevicesAsync(stationId, cancellationToken), ScadaApiMessages.StationChartDevicesOk);

    [HttpGet("{stationId:long}/devices/{deviceId:long}/charts/{chart}/history")]
    [Authorize(Policy = Permissions.Trend.View)]
    [ProducesResponseType(typeof(ApiResponse<StationChartHistoryDto>), ScadaHttpStatuses.Ok)]
    [ProducesResponseType(typeof(ApiResponse<StationChartHistoryDto>), ScadaHttpStatuses.BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<StationChartHistoryDto>), ScadaHttpStatuses.NotFound)]
    public async Task<IActionResult> GetChartHistory(
        long stationId,
        long deviceId,
        string chart,
        [FromQuery] StationChartHistoryQuery query,
        CancellationToken cancellationToken) =>
        this.ToActionResult(
            await stations.GetChartHistoryAsync(stationId, deviceId, chart, query, cancellationToken),
            ScadaApiMessages.StationChartHistoryOk);

    private IActionResult ToExcelResult(Result<byte[]> result, string filePrefix)
    {
        if (result.IsFailure)
            return this.ToActionResult(result, string.Empty);

        return File(
            result.Value!,
            ApplicationConstants.ExcelContentType,
            FileHelper.GenerateTimestampedFileName(filePrefix, "xlsx"));
    }
}

using Backend.Application.DTOs.Audit;
using Backend.Shared.Pagination;
using Backend.Shared.Results;

namespace Backend.Application.Interfaces.Services;

/// <summary>BE 3.1a — read side of the System Audit Log (Admin query screen).</summary>
public interface ISystemAuditLogQueryService
{
    Task<Result<PaginationResult<SystemAuditLogDto>>> GetPagedAsync(SystemAuditLogQuery query, CancellationToken cancellationToken = default);

    Task<Result<SystemAuditLogDto>> GetByIdAsync(long id, CancellationToken cancellationToken = default);

    /// <summary>Xuất Excel nhật ký (tab Đăng nhập / audit) — tối đa 10_000 dòng.</summary>
    Task<Result<byte[]>> ExportExcelAsync(SystemAuditLogQuery query, CancellationToken cancellationToken = default);
}

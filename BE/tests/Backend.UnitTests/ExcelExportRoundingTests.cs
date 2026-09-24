using Backend.Infrastructure.Reporting;
using Backend.Shared.Models;
using ClosedXML.Excel;

namespace Backend.UnitTests;

public class ExcelExportRoundingTests
{
    [Fact]
    public async Task Floating_point_cells_round_to_one_decimal()
    {
        var service = new ExcelImportExportService();
        var rows = new[]
        {
            new MeasureRow("24/09/2026 10:00:00", 1.26, 2.25, 10.04, 12, null),
        };
        var columns = new ExcelColumns<MeasureRow>
        {
            { "Thời gian", row => row.Time },
            { "Mức nước sông", row => row.River },
            { "Nhiệt độ A", row => row.Temp },
            { "Dòng R", row => row.Current },
            { "Số nguyên", row => row.Whole },
            { "PF", row => row.Empty },
        };

        var bytes = await service.ExportExcelAsync(rows, columns, "BaoCao");

        using var workbook = new XLWorkbook(new MemoryStream(bytes));
        var sheet = workbook.Worksheet(1);

        Assert.Equal("24/09/2026 10:00:00", sheet.Cell(2, 1).GetString());
        Assert.Equal(1.3, sheet.Cell(2, 2).GetDouble(), precision: 10);
        Assert.Equal(2.3, sheet.Cell(2, 3).GetDouble(), precision: 10);
        Assert.Equal(10.0, sheet.Cell(2, 4).GetDouble(), precision: 10);
        Assert.Equal(12, sheet.Cell(2, 5).GetDouble(), precision: 10);
        Assert.True(sheet.Cell(2, 6).IsEmpty());
        Assert.Equal("0.0", sheet.Cell(2, 2).Style.NumberFormat.Format);
        Assert.Equal("0.0", sheet.Cell(2, 4).Style.NumberFormat.Format);
        Assert.NotEqual("0.0", sheet.Cell(2, 5).Style.NumberFormat.Format);
    }

    private sealed record MeasureRow(string Time, double River, double Temp, double Current, double Whole, double? Empty);
}

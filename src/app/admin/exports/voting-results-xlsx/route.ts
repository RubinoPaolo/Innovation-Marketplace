import ExcelJS from "exceljs";
import { getCurrentAdminSession } from "@/lib/admin-session";
import { getActiveCourseEdition } from "@/lib/active-edition";
import { buildVotingResultsExportData } from "@/lib/voting-results-export";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function buildFileSafeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export async function GET() {
  const [adminSession, activeEdition] = await Promise.all([
    getCurrentAdminSession(),
    getActiveCourseEdition(),
  ]);

  if (!adminSession) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  if (!activeEdition) {
    return new Response("No active course edition is configured.", {
      status: 409,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const exportData = await buildVotingResultsExportData({
    id: activeEdition.id,
    name: activeEdition.name,
  });

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Innovation Management Platform";
  workbook.created = exportData.generatedAt;
  workbook.modified = exportData.generatedAt;

  const darkFill = {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FF0F172A" },
  };

  const softFill = {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FFE2E8F0" },
  };

  const accentFill = {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FFDBEAFE" },
  };

  const thinBorder = {
    top: { style: "thin" as const, color: { argb: "FFD1D5DB" } },
    left: { style: "thin" as const, color: { argb: "FFD1D5DB" } },
    bottom: { style: "thin" as const, color: { argb: "FFD1D5DB" } },
    right: { style: "thin" as const, color: { argb: "FFD1D5DB" } },
  };

  const summarySheet = workbook.addWorksheet("Summary", {
    views: [{ showGridLines: false }],
  });

  summarySheet.mergeCells("A1:H1");
  const summaryTitle = summarySheet.getCell("A1");
  summaryTitle.value = "Voting Results Summary";
  summaryTitle.font = {
    bold: true,
    size: 18,
    color: { argb: "FFFFFFFF" },
  };
  summaryTitle.fill = darkFill;
  summaryTitle.alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  summarySheet.getRow(1).height = 30;

  summarySheet.mergeCells("A2:H2");
  const summarySubtitle = summarySheet.getCell("A2");
  summarySubtitle.value = `Edition: ${exportData.edition.name}`;
  summarySubtitle.font = {
    bold: true,
    size: 12,
    color: { argb: "FF334155" },
  };
  summarySubtitle.alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  summarySheet.getRow(2).height = 24;

  const metricCells = [
    ["A4", "Active students", "B4", exportData.activeStudents],
    ["D4", "Published products", "E4", exportData.publishedProducts],
    ["G4", "Recorded interests", "H4", exportData.totalInterests],
    ["A5", "Generated at", "B5", formatDateTime(exportData.generatedAt)],
  ] as const;

  for (const [labelCellRef, label, valueCellRef, value] of metricCells) {
    const labelCell = summarySheet.getCell(labelCellRef);
    const valueCell = summarySheet.getCell(valueCellRef);

    labelCell.value = label;
    labelCell.font = {
      bold: true,
      color: { argb: "FF475569" },
    };
    labelCell.fill = softFill;
    labelCell.border = thinBorder;
    labelCell.alignment = {
      vertical: "middle",
    };

    valueCell.value = value;
    valueCell.font = {
      bold: true,
      size: 12,
      color: { argb: "FF0F172A" },
    };
    valueCell.fill = accentFill;
    valueCell.border = thinBorder;
    valueCell.alignment = {
      vertical: "middle",
    };
  }

  summarySheet.mergeCells("A7:E7");
  const topTenTitle = summarySheet.getCell("A7");
  topTenTitle.value = "Top 10 most desired products";
  topTenTitle.font = {
    bold: true,
    size: 14,
    color: { argb: "FF0F172A" },
  };

  if (exportData.rows.length > 0) {
    const topTenRows = exportData.rows.slice(0, 10);

    summarySheet.addTable({
      name: "TopTenProductsTable",
      ref: "A9",
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
      columns: [
        { name: "Rank", filterButton: true },
        { name: "Product", filterButton: true },
        { name: "Group", filterButton: true },
        { name: "Interested students", filterButton: true },
        { name: "Interest rate", filterButton: true },
      ],
      rows: topTenRows.map((row) => [
        row.rank,
        row.product,
        row.group,
        row.interestedStudents,
        row.interestRate,
      ]),
    });

    for (let index = 0; index < topTenRows.length; index += 1) {
      const excelRowNumber = 10 + index;
      summarySheet.getCell(`E${excelRowNumber}`).numFmt = "0.00%";
    }
  } else {
    summarySheet.getCell("A9").value =
      "No published products are available for export.";
    summarySheet.getCell("A9").font = {
      italic: true,
      color: { argb: "FF64748B" },
    };
  }

  summarySheet.getColumn(1).width = 18;
  summarySheet.getColumn(2).width = 32;
  summarySheet.getColumn(3).width = 6;
  summarySheet.getColumn(4).width = 24;
  summarySheet.getColumn(5).width = 18;
  summarySheet.getColumn(6).width = 6;
  summarySheet.getColumn(7).width = 24;
  summarySheet.getColumn(8).width = 18;

  const resultsSheet = workbook.addWorksheet("Voting Results", {
    views: [{ state: "frozen", ySplit: 7, showGridLines: false }],
  });

  resultsSheet.mergeCells("A1:H1");
  const resultsTitle = resultsSheet.getCell("A1");
  resultsTitle.value = "Detailed Voting Results";
  resultsTitle.font = {
    bold: true,
    size: 18,
    color: { argb: "FFFFFFFF" },
  };
  resultsTitle.fill = darkFill;
  resultsTitle.alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  resultsSheet.getRow(1).height = 30;

  resultsSheet.mergeCells("A2:H2");
  const resultsSubtitle = resultsSheet.getCell("A2");
  resultsSubtitle.value = `Edition: ${exportData.edition.name}`;
  resultsSubtitle.font = {
    bold: true,
    size: 12,
    color: { argb: "FF334155" },
  };
  resultsSubtitle.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  const metaRows = [
    ["A4", "Active students", "B4", exportData.activeStudents],
    ["D4", "Published products", "E4", exportData.publishedProducts],
    ["G4", "Recorded interests", "H4", exportData.totalInterests],
  ] as const;

  for (const [labelCellRef, label, valueCellRef, value] of metaRows) {
    const labelCell = resultsSheet.getCell(labelCellRef);
    const valueCell = resultsSheet.getCell(valueCellRef);

    labelCell.value = label;
    labelCell.font = {
      bold: true,
      color: { argb: "FF475569" },
    };
    labelCell.fill = softFill;
    labelCell.border = thinBorder;

    valueCell.value = value;
    valueCell.font = {
      bold: true,
      color: { argb: "FF0F172A" },
    };
    valueCell.fill = accentFill;
    valueCell.border = thinBorder;
  }

  if (exportData.rows.length > 0) {
    resultsSheet.addTable({
      name: "VotingResultsTable",
      ref: "A7",
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
      columns: [
        { name: "Rank", filterButton: true },
        { name: "Product", filterButton: true },
        { name: "Group", filterButton: true },
        { name: "Category", filterButton: true },
        { name: "Price EUR", filterButton: true },
        { name: "Interested students", filterButton: true },
        { name: "Interest rate", filterButton: true },
        { name: "Publication status", filterButton: true },
      ],
      rows: exportData.rows.map((row) => [
        row.rank,
        row.product,
        row.group,
        row.category,
        row.priceCents / 100,
        row.interestedStudents,
        row.interestRate,
        row.publicationStatus,
      ]),
    });

    for (let index = 0; index < exportData.rows.length; index += 1) {
      const excelRowNumber = 8 + index;

      resultsSheet.getCell(`E${excelRowNumber}`).numFmt = '"€"#,##0.00';
      resultsSheet.getCell(`G${excelRowNumber}`).numFmt = "0.00%";

      resultsSheet.getCell(`A${excelRowNumber}`).alignment = {
        horizontal: "center",
      };
      resultsSheet.getCell(`E${excelRowNumber}`).alignment = {
        horizontal: "right",
      };
      resultsSheet.getCell(`F${excelRowNumber}`).alignment = {
        horizontal: "center",
      };
      resultsSheet.getCell(`G${excelRowNumber}`).alignment = {
        horizontal: "center",
      };

      if (index === 0) {
        resultsSheet.getCell(`A${excelRowNumber}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFE08A" },
        };
      }

      if (index === 1) {
        resultsSheet.getCell(`A${excelRowNumber}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE5E7EB" },
        };
      }

      if (index === 2) {
        resultsSheet.getCell(`A${excelRowNumber}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF4C7AB" },
        };
      }
    }
  } else {
    resultsSheet.getCell("A7").value =
      "No published products are available for export.";
    resultsSheet.getCell("A7").font = {
      italic: true,
      color: { argb: "FF64748B" },
    };
  }

  resultsSheet.getColumn(1).width = 10;
  resultsSheet.getColumn(2).width = 34;
  resultsSheet.getColumn(3).width = 28;
  resultsSheet.getColumn(4).width = 22;
  resultsSheet.getColumn(5).width = 16;
  resultsSheet.getColumn(6).width = 22;
  resultsSheet.getColumn(7).width = 16;
  resultsSheet.getColumn(8).width = 20;

  const workbookBuffer = Buffer.from(await workbook.xlsx.writeBuffer());

  const fileSafeEditionName =
    buildFileSafeName(activeEdition.name) || "active-edition";

  return new Response(workbookBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="voting-results-${fileSafeEditionName}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
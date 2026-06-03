import ExcelJS from "exceljs";
import { getCurrentAdminSession } from "@/lib/admin-session";
import { getActiveCourseEdition } from "@/lib/active-edition";
import { buildVotingResultsExportData } from "@/lib/voting-results-export";
import { formatPriceFromCents } from "@/lib/price";

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

function addSheetTitle(
  worksheet: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
  lastColumn: string,
) {
  worksheet.mergeCells(`A1:${lastColumn}1`);
  const titleCell = worksheet.getCell("A1");
  titleCell.value = title;
  titleCell.font = {
    bold: true,
    size: 18,
    color: { argb: "FFFFFFFF" },
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  };
  titleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells(`A2:${lastColumn}2`);
  const subtitleCell = worksheet.getCell("A2");
  subtitleCell.value = subtitle;
  subtitleCell.font = {
    bold: true,
    size: 12,
    color: { argb: "FF334155" },
  };
  subtitleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  worksheet.getRow(2).height = 24;
}

function applyHeaderWidths(
  worksheet: ExcelJS.Worksheet,
  widths: number[],
) {
  widths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });
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

  addSheetTitle(
    summarySheet,
    "Innovation Marketplace Export Summary",
    `Edition: ${exportData.edition.name}`,
    "H",
  );

  const metricCells = [
    ["A4", "Active groups", "B4", exportData.activeGroups],
    ["D4", "Active students", "E4", exportData.activeStudents],
    ["G4", "Published products", "H4", exportData.publishedProducts],
    ["A5", "Yes votes", "B5", exportData.totalYesVotes],
    ["D5", "No votes", "E5", exportData.totalNoVotes],
    [
      "G5",
      "Feedback responses",
      "H5",
      exportData.totalFeedbackResponses,
    ],
    ["A6", "Feature ratings", "B6", exportData.totalFeatureRatings],
    [
      "D6",
      "Evaluation ratings",
      "E6",
      exportData.totalEvaluationRatings,
    ],
    ["G6", "Generated at", "H6", formatDateTime(exportData.generatedAt)],
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

    valueCell.value = value;
    valueCell.font = {
      bold: true,
      size: 12,
      color: { argb: "FF0F172A" },
    };
    valueCell.fill = accentFill;
    valueCell.border = thinBorder;
  }

  summarySheet.mergeCells("A8:F8");
  const topTenTitle = summarySheet.getCell("A8");
  topTenTitle.value = "Top 10 products by Yes votes";
  topTenTitle.font = {
    bold: true,
    size: 14,
    color: { argb: "FF0F172A" },
  };

  const topTenRows = exportData.productSummaryRows.slice(0, 10);

  if (topTenRows.length > 0) {
    summarySheet.addTable({
      name: "TopTenProductsTable",
      ref: "A10",
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
      columns: [
        { name: "Rank", filterButton: true },
        { name: "Product", filterButton: true },
        { name: "Product group", filterButton: true },
        { name: "Yes votes", filterButton: true },
        { name: "No votes", filterButton: true },
        { name: "Positive group rate", filterButton: true },
      ],
      rows: topTenRows.map((row) => [
        row.rank,
        row.product,
        row.group,
        row.yesVotes,
        row.noVotes,
        row.positiveRate,
      ]),
    });

    for (let index = 0; index < topTenRows.length; index += 1) {
      const excelRowNumber = 11 + index;
      summarySheet.getCell(`F${excelRowNumber}`).numFmt = "0.00%";
    }
  } else {
    summarySheet.getCell("A10").value =
      "No product summary rows are available.";
    summarySheet.getCell("A10").font = {
      italic: true,
      color: { argb: "FF64748B" },
    };
  }

  applyHeaderWidths(summarySheet, [16, 34, 28, 18, 18, 20, 22, 22]);

  const productSummarySheet = workbook.addWorksheet("Product Summary", {
    views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
  });

  addSheetTitle(
    productSummarySheet,
    "Product Summary",
    `Edition: ${exportData.edition.name}`,
    "N",
  );

  if (exportData.productSummaryRows.length > 0) {
    productSummarySheet.addTable({
      name: "ProductSummaryTable",
      ref: "A4",
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
      columns: [
        { name: "Rank", filterButton: true },
        { name: "Product ID", filterButton: true },
        { name: "Product", filterButton: true },
        { name: "Product group", filterButton: true },
        { name: "Category", filterButton: true },
        { name: "Price", filterButton: true },
        { name: "Price cents", filterButton: true },
        { name: "Publication status", filterButton: true },
        { name: "Yes votes", filterButton: true },
        { name: "No votes", filterButton: true },
        { name: "Feedback responses", filterButton: true },
        { name: "Positive group rate", filterButton: true },
        { name: "Feature ratings", filterButton: true },
        { name: "Evaluation ratings", filterButton: true },
      ],
      rows: exportData.productSummaryRows.map((row) => [
        row.rank,
        row.productId,
        row.product,
        row.group,
        row.category,
        formatPriceFromCents(row.priceCents),
        row.priceCents,
        row.publicationStatus,
        row.yesVotes,
        row.noVotes,
        row.feedbackResponses,
        row.positiveRate,
        row.featureRatingsCount,
        row.evaluationRatingsCount,
      ]),
    });

    for (
      let index = 0;
      index < exportData.productSummaryRows.length;
      index += 1
    ) {
      const excelRowNumber = 5 + index;
      productSummarySheet.getCell(`G${excelRowNumber}`).numFmt = "@";
      productSummarySheet.getCell(`L${excelRowNumber}`).numFmt = "0.00%";
    }
  } else {
    productSummarySheet.getCell("A4").value =
      "No product summary rows are available.";
  }

  applyHeaderWidths(productSummarySheet, [
    10, 12, 36, 28, 22, 22, 24, 20, 14, 14, 20, 20, 18, 20,
  ]);

  const feedbackSheet = workbook.addWorksheet("Product Feedback", {
    views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
  });

  addSheetTitle(
    feedbackSheet,
    "Product Feedback",
    `Edition: ${exportData.edition.name}`,
    "K",
  );

  if (exportData.productFeedbackRows.length > 0) {
    feedbackSheet.addTable({
      name: "ProductFeedbackTable",
      ref: "A4",
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
      columns: [
        { name: "Feedback ID", filterButton: true },
        { name: "Product ID", filterButton: true },
        { name: "Product", filterButton: true },
        { name: "Product group", filterButton: true },
        { name: "Category", filterButton: true },
        { name: "Voting group", filterButton: true },
        { name: "Last edited by student ID", filterButton: true },
        { name: "Decision", filterButton: true },
        { name: "Reason", filterButton: true },
        { name: "Created at", filterButton: true },
        { name: "Updated at", filterButton: true },
      ],
      rows: exportData.productFeedbackRows.map((row) => [
        row.feedbackId,
        row.productId,
        row.product,
        row.group,
        row.category,
        row.votingGroup,
        row.submittedByStudentNumber,
        row.decision,
        row.reason,
        formatDateTime(row.createdAt),
        formatDateTime(row.updatedAt),
      ]),
    });
  } else {
    feedbackSheet.getCell("A4").value =
      "No product feedback rows are available.";
  }

  applyHeaderWidths(feedbackSheet, [
    14, 12, 36, 28, 22, 28, 24, 14, 60, 24, 24,
  ]);

  const featureRatingsSheet = workbook.addWorksheet("Feature Ratings", {
    views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
  });

  addSheetTitle(
    featureRatingsSheet,
    "Feature Ratings",
    `Edition: ${exportData.edition.name}`,
    "K",
  );

  if (exportData.featureRatingRows.length > 0) {
    featureRatingsSheet.addTable({
      name: "FeatureRatingsTable",
      ref: "A4",
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
      columns: [
        { name: "Rating ID", filterButton: true },
        { name: "Product ID", filterButton: true },
        { name: "Product", filterButton: true },
        { name: "Product group", filterButton: true },
        { name: "Category", filterButton: true },
        { name: "Feature ID", filterButton: true },
        { name: "Feature", filterButton: true },
        { name: "Student number", filterButton: true },
        { name: "Rating", filterButton: true },
        { name: "Created at", filterButton: true },
        { name: "Updated at", filterButton: true },
      ],
      rows: exportData.featureRatingRows.map((row) => [
        row.ratingId,
        row.productId,
        row.product,
        row.group,
        row.category,
        row.featureId,
        row.feature,
        row.studentNumber,
        row.rating,
        formatDateTime(row.createdAt),
        formatDateTime(row.updatedAt),
      ]),
    });
  } else {
    featureRatingsSheet.getCell("A4").value =
      "No feature rating rows are available.";
  }

  applyHeaderWidths(featureRatingsSheet, [
    12, 12, 36, 28, 22, 12, 56, 18, 12, 24, 24,
  ]);

  const evaluationRatingsSheet = workbook.addWorksheet("Evaluation Ratings", {
    views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
  });

  addSheetTitle(
    evaluationRatingsSheet,
    "Evaluation Question Ratings",
    `Edition: ${exportData.edition.name}`,
    "K",
  );

  if (exportData.evaluationRatingRows.length > 0) {
    evaluationRatingsSheet.addTable({
      name: "EvaluationRatingsTable",
      ref: "A4",
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
      columns: [
        { name: "Rating ID", filterButton: true },
        { name: "Product ID", filterButton: true },
        { name: "Product", filterButton: true },
        { name: "Product group", filterButton: true },
        { name: "Category", filterButton: true },
        { name: "Question key", filterButton: true },
        { name: "Evaluation question", filterButton: true },
        { name: "Student number", filterButton: true },
        { name: "Rating", filterButton: true },
        { name: "Created at", filterButton: true },
        { name: "Updated at", filterButton: true },
      ],
      rows: exportData.evaluationRatingRows.map((row) => [
        row.ratingId,
        row.productId,
        row.product,
        row.group,
        row.category,
        row.questionKey,
        row.questionPrompt,
        row.studentNumber,
        row.rating,
        formatDateTime(row.createdAt),
        formatDateTime(row.updatedAt),
      ]),
    });
  } else {
    evaluationRatingsSheet.getCell("A4").value =
      "No evaluation rating rows are available.";
  }

  applyHeaderWidths(evaluationRatingsSheet, [
    12, 12, 36, 28, 22, 28, 72, 18, 12, 24, 24,
  ]);

  const workbookBuffer = Buffer.from(await workbook.xlsx.writeBuffer());

  const fileSafeEditionName =
    buildFileSafeName(activeEdition.name) || "active-edition";

  return new Response(workbookBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="complete-voting-data-${fileSafeEditionName}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
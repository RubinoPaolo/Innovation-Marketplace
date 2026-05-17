import { getCurrentAdminSession } from "@/lib/admin-session";
import { getActiveCourseEdition } from "@/lib/active-edition";
import { buildVotingResultsExportData } from "@/lib/voting-results-export";

export const dynamic = "force-dynamic";

function escapeCsvValue(value: string | number | null | undefined): string {
  const normalizedValue = String(value ?? "");

  if (
    normalizedValue.includes(",") ||
    normalizedValue.includes('"') ||
    normalizedValue.includes("\n") ||
    normalizedValue.includes("\r")
  ) {
    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }

  return normalizedValue;
}

function formatPrice(priceCents: number): string {
  return (priceCents / 100).toFixed(2);
}

function formatPercentage(rate: number): string {
  return (rate * 100).toFixed(2);
}

function formatDateTime(date: Date | null | undefined): string {
  if (!date) {
    return "";
  }

  return date.toISOString();
}

function buildFileSafeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

  const csvRows: Array<Array<string | number>> = [
    [
      "Record type",
      "Rank",
      "Product ID",
      "Product",
      "Group",
      "Category",
      "Price EUR",
      "Publication status",
      "Yes votes",
      "No votes",
      "Feedback responses",
      "Positive rate %",
      "Feature ratings count",
      "Evaluation ratings count",
      "Student number",
      "Decision",
      "Reason",
      "Feature ID",
      "Feature",
      "Evaluation question key",
      "Evaluation question",
      "Rating",
      "Created at",
      "Updated at",
    ],
  ];

  for (const row of exportData.productSummaryRows) {
    csvRows.push([
      "PRODUCT_SUMMARY",
      row.rank,
      row.productId,
      row.product,
      row.group,
      row.category,
      formatPrice(row.priceCents),
      row.publicationStatus,
      row.yesVotes,
      row.noVotes,
      row.feedbackResponses,
      formatPercentage(row.positiveRate),
      row.featureRatingsCount,
      row.evaluationRatingsCount,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
  }

  for (const row of exportData.productFeedbackRows) {
    csvRows.push([
      "PRODUCT_FEEDBACK",
      "",
      row.productId,
      row.product,
      row.group,
      row.category,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      row.studentNumber,
      row.decision,
      row.reason,
      "",
      "",
      "",
      "",
      "",
      formatDateTime(row.createdAt),
      "",
    ]);
  }

  for (const row of exportData.featureRatingRows) {
    csvRows.push([
      "FEATURE_RATING",
      "",
      row.productId,
      row.product,
      row.group,
      row.category,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      row.studentNumber,
      "",
      "",
      row.featureId,
      row.feature,
      "",
      "",
      row.rating,
      formatDateTime(row.createdAt),
      formatDateTime(row.updatedAt),
    ]);
  }

  for (const row of exportData.evaluationRatingRows) {
    csvRows.push([
      "EVALUATION_RATING",
      "",
      row.productId,
      row.product,
      row.group,
      row.category,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      row.studentNumber,
      "",
      "",
      "",
      "",
      row.questionKey,
      row.questionPrompt,
      row.rating,
      formatDateTime(row.createdAt),
      formatDateTime(row.updatedAt),
    ]);
  }

  const csvContent =
    "\uFEFF" +
    csvRows
      .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
      .join("\n");

  const fileSafeEditionName =
    buildFileSafeName(activeEdition.name) || "active-edition";

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="complete-voting-data-${fileSafeEditionName}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
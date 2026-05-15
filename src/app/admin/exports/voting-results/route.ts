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

  const csvRows = [
    [
      "Rank",
      "Product",
      "Group",
      "Category",
      "Price EUR",
      "Interested students",
      "Interest rate %",
      "Publication status",
    ],
    ...exportData.rows.map((row) => [
      row.rank,
      row.product,
      row.group,
      row.category,
      formatPrice(row.priceCents),
      row.interestedStudents,
      formatPercentage(row.interestRate),
      row.publicationStatus,
    ]),
  ];

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
      "Content-Disposition": `attachment; filename="voting-results-${fileSafeEditionName}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
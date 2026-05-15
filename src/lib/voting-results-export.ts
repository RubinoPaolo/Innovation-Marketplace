import { prisma } from "@/lib/prisma";

export type VotingResultsExportEdition = {
  id: number;
  name: string;
};

export type VotingResultsExportRow = {
  rank: number;
  product: string;
  group: string;
  category: string;
  priceCents: number;
  interestedStudents: number;
  interestRate: number;
  publicationStatus: string;
};

export type VotingResultsExportData = {
  edition: VotingResultsExportEdition;
  generatedAt: Date;
  activeStudents: number;
  publishedProducts: number;
  totalInterests: number;
  rows: VotingResultsExportRow[];
};

export async function buildVotingResultsExportData(
  edition: VotingResultsExportEdition,
): Promise<VotingResultsExportData> {
  const [products, activeStudents] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        group: {
          editionId: edition.id,
          isActive: true,
        },
      },
      select: {
        id: true,
        title: true,
        priceCents: true,
        status: true,
        category: {
          select: {
            name: true,
          },
        },
        group: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    }),
    prisma.groupMember.count({
      where: {
        editionId: edition.id,
        isActive: true,
        group: {
          isActive: true,
        },
      },
    }),
  ]);

  const productIds = products.map((product) => product.id);

  const interestCounts =
    productIds.length > 0
      ? await prisma.purchaseInterest.groupBy({
          by: ["productId"],
          where: {
            productId: {
              in: productIds,
            },
          },
          _count: {
            productId: true,
          },
        })
      : [];

  const interestsByProductId = new Map(
    interestCounts.map((interestCount) => [
      interestCount.productId,
      interestCount._count.productId,
    ]),
  );

  const rankedRows = products
    .map((product) => {
      const interestedStudents = interestsByProductId.get(product.id) ?? 0;
      const interestRate =
        activeStudents > 0 ? interestedStudents / activeStudents : 0;

      return {
        product: product.title,
        group: product.group.name,
        category: product.category?.name ?? "",
        priceCents: product.priceCents,
        interestedStudents,
        interestRate,
        publicationStatus: product.status,
      };
    })
    .sort((firstProduct, secondProduct) => {
      if (
        secondProduct.interestedStudents !==
        firstProduct.interestedStudents
      ) {
        return (
          secondProduct.interestedStudents -
          firstProduct.interestedStudents
        );
      }

      return firstProduct.product.localeCompare(secondProduct.product);
    })
    .map((product, index) => ({
      rank: index + 1,
      ...product,
    }));

  const totalInterests = rankedRows.reduce(
    (sum, row) => sum + row.interestedStudents,
    0,
  );

  return {
    edition,
    generatedAt: new Date(),
    activeStudents,
    publishedProducts: rankedRows.length,
    totalInterests,
    rows: rankedRows,
  };
}
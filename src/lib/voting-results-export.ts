import { prisma } from "@/lib/prisma";

export type VotingResultsExportEdition = {
  id: number;
  name: string;
};

export type ProductSummaryExportRow = {
  rank: number;
  productId: number;
  product: string;
  group: string;
  category: string;
  priceCents: number;
  publicationStatus: string;
  yesVotes: number;
  noVotes: number;
  feedbackResponses: number;
  positiveRate: number;
  featureRatingsCount: number;
  evaluationRatingsCount: number;
};

export type ProductFeedbackExportRow = {
  feedbackId: number;
  productId: number;
  product: string;
  group: string;
  category: string;
  votingGroup: string;
  submittedByStudentNumber: string;
  decision: string;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FeatureRatingExportRow = {
  ratingId: number;
  productId: number;
  product: string;
  group: string;
  category: string;
  featureId: number;
  feature: string;
  studentNumber: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
};

export type EvaluationRatingExportRow = {
  ratingId: number;
  productId: number;
  product: string;
  group: string;
  category: string;
  questionKey: string;
  questionPrompt: string;
  studentNumber: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
};

export type VotingResultsExportData = {
  edition: VotingResultsExportEdition;
  generatedAt: Date;
  activeGroups: number;
  activeStudents: number;
  publishedProducts: number;
  totalYesVotes: number;
  totalNoVotes: number;
  totalFeedbackResponses: number;
  totalFeatureRatings: number;
  totalEvaluationRatings: number;
  productSummaryRows: ProductSummaryExportRow[];
  productFeedbackRows: ProductFeedbackExportRow[];
  featureRatingRows: FeatureRatingExportRow[];
  evaluationRatingRows: EvaluationRatingExportRow[];
};

export async function buildVotingResultsExportData(
  edition: VotingResultsExportEdition,
): Promise<VotingResultsExportData> {
  const [
    products,
    activeGroups,
    activeStudents,
    feedbackRowsRaw,
    featureRatingRowsRaw,
    evaluationRatingRowsRaw,
  ] = await Promise.all([
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

    prisma.group.count({
      where: {
        editionId: edition.id,
        isActive: true,
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

    prisma.purchaseInterest.findMany({
      where: {
        product: {
          status: "PUBLISHED",
          group: {
            editionId: edition.id,
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        productId: true,
        decision: true,
        reason: true,
        createdAt: true,
        updatedAt: true,
        group: {
          select: {
            name: true,
          },
        },
        member: {
          select: {
            studentNumber: true,
          },
        },
        product: {
          select: {
            title: true,
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
        },
      },
      orderBy: [
        {
          productId: "asc",
        },
        {
          updatedAt: "asc",
        },
      ],
    }),

    prisma.featureRating.findMany({
      where: {
        feature: {
          product: {
            status: "PUBLISHED",
            group: {
              editionId: edition.id,
              isActive: true,
            },
          },
        },
      },
      select: {
        id: true,
        rating: true,
        createdAt: true,
        updatedAt: true,
        member: {
          select: {
            studentNumber: true,
          },
        },
        feature: {
          select: {
            id: true,
            text: true,
            productId: true,
            product: {
              select: {
                title: true,
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
            },
          },
        },
      },
      orderBy: [
        {
          featureId: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    }),

    prisma.productQuestionRating.findMany({
      where: {
        product: {
          status: "PUBLISHED",
          group: {
            editionId: edition.id,
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        productId: true,
        rating: true,
        createdAt: true,
        updatedAt: true,
        member: {
          select: {
            studentNumber: true,
          },
        },
        product: {
          select: {
            title: true,
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
        },
        question: {
          select: {
            key: true,
            prompt: true,
          },
        },
      },
      orderBy: [
        {
          productId: "asc",
        },
        {
          questionId: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    }),
  ]);

  const yesVotesByProductId = new Map<number, number>();
  const noVotesByProductId = new Map<number, number>();
  const featureRatingsByProductId = new Map<number, number>();
  const evaluationRatingsByProductId = new Map<number, number>();

  for (const feedback of feedbackRowsRaw) {
    const targetMap =
      feedback.decision === "NO"
        ? noVotesByProductId
        : yesVotesByProductId;

    targetMap.set(
      feedback.productId,
      (targetMap.get(feedback.productId) ?? 0) + 1,
    );
  }

  for (const rating of featureRatingRowsRaw) {
    const productId = rating.feature.productId;

    featureRatingsByProductId.set(
      productId,
      (featureRatingsByProductId.get(productId) ?? 0) + 1,
    );
  }

  for (const rating of evaluationRatingRowsRaw) {
    evaluationRatingsByProductId.set(
      rating.productId,
      (evaluationRatingsByProductId.get(rating.productId) ?? 0) + 1,
    );
  }

  const rankedProductRows = products
    .map((product) => {
      const yesVotes = yesVotesByProductId.get(product.id) ?? 0;
      const noVotes = noVotesByProductId.get(product.id) ?? 0;
      const feedbackResponses = yesVotes + noVotes;
      const positiveRate = activeGroups > 0 ? yesVotes / activeGroups : 0;

      return {
        productId: product.id,
        product: product.title,
        group: product.group.name,
        category: product.category?.name ?? "",
        priceCents: product.priceCents,
        publicationStatus: product.status,
        yesVotes,
        noVotes,
        feedbackResponses,
        positiveRate,
        featureRatingsCount: featureRatingsByProductId.get(product.id) ?? 0,
        evaluationRatingsCount:
          evaluationRatingsByProductId.get(product.id) ?? 0,
      };
    })
    .sort((firstProduct, secondProduct) => {
      if (secondProduct.yesVotes !== firstProduct.yesVotes) {
        return secondProduct.yesVotes - firstProduct.yesVotes;
      }

      if (secondProduct.positiveRate !== firstProduct.positiveRate) {
        return secondProduct.positiveRate - firstProduct.positiveRate;
      }

      return firstProduct.product.localeCompare(secondProduct.product);
    })
    .map((product, index) => ({
      rank: index + 1,
      ...product,
    }));

  const productFeedbackRows: ProductFeedbackExportRow[] =
    feedbackRowsRaw.map((feedback) => ({
      feedbackId: feedback.id,
      productId: feedback.productId,
      product: feedback.product.title,
      group: feedback.product.group.name,
      category: feedback.product.category?.name ?? "",
      votingGroup: feedback.group.name,
      submittedByStudentNumber: feedback.member?.studentNumber ?? "",
      decision: feedback.decision,
      reason: feedback.reason ?? "",
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    }));

  const featureRatingRows: FeatureRatingExportRow[] =
    featureRatingRowsRaw.map((rating) => ({
      ratingId: rating.id,
      productId: rating.feature.productId,
      product: rating.feature.product.title,
      group: rating.feature.product.group.name,
      category: rating.feature.product.category?.name ?? "",
      featureId: rating.feature.id,
      feature: rating.feature.text,
      studentNumber: rating.member.studentNumber,
      rating: rating.rating,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
    }));

  const evaluationRatingRows: EvaluationRatingExportRow[] =
    evaluationRatingRowsRaw.map((rating) => ({
      ratingId: rating.id,
      productId: rating.productId,
      product: rating.product.title,
      group: rating.product.group.name,
      category: rating.product.category?.name ?? "",
      questionKey: rating.question.key,
      questionPrompt: rating.question.prompt,
      studentNumber: rating.member.studentNumber,
      rating: rating.rating,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
    }));

  const totalYesVotes = rankedProductRows.reduce(
    (sum, row) => sum + row.yesVotes,
    0,
  );

  const totalNoVotes = rankedProductRows.reduce(
    (sum, row) => sum + row.noVotes,
    0,
  );

  return {
    edition,
    generatedAt: new Date(),
    activeGroups,
    activeStudents,
    publishedProducts: rankedProductRows.length,
    totalYesVotes,
    totalNoVotes,
    totalFeedbackResponses: productFeedbackRows.length,
    totalFeatureRatings: featureRatingRows.length,
    totalEvaluationRatings: evaluationRatingRows.length,
    productSummaryRows: rankedProductRows,
    productFeedbackRows,
    featureRatingRows,
    evaluationRatingRows,
  };
}
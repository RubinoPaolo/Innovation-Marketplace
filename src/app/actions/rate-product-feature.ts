'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentSession } from "@/lib/student-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

export type FeatureRatingState = {
  status: "idle" | "success" | "error";
  message: string;
  featureId: number;
  currentRating: number | null;
  averageRating: number | null;
  ratingCount: number;
  votingOpen: boolean;
  isOwnProduct: boolean;
};

type FeatureRatingIntent = "SAVE" | "WITHDRAW";

function parsePositiveInteger(
  value: FormDataEntryValue | null,
): number | null {
  const parsedValue = Number(String(value ?? "").trim());

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function parseRating(value: FormDataEntryValue | null): number | null {
  const rating = Number(String(value ?? "").trim());

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null;
  }

  return rating;
}

function parseIntent(value: FormDataEntryValue | null): FeatureRatingIntent {
  const normalizedValue = String(value ?? "").trim().toUpperCase();

  if (normalizedValue === "WITHDRAW") {
    return "WITHDRAW";
  }

  return "SAVE";
}

async function getFeatureRatingSummary(featureId: number): Promise<{
  averageRating: number | null;
  ratingCount: number;
}> {
  const aggregate = await prisma.featureRating.aggregate({
    where: {
      featureId,
    },
    _avg: {
      rating: true,
    },
    _count: {
      _all: true,
    },
  });

  return {
    averageRating:
      aggregate._avg.rating === null
        ? null
        : Number(aggregate._avg.rating.toFixed(1)),
    ratingCount: aggregate._count._all,
  };
}

export async function rateProductFeature(
  previousState: FeatureRatingState,
  formData: FormData,
): Promise<FeatureRatingState> {
  const [currentSession, activeEdition] = await Promise.all([
    getCurrentStudentSession(),
    getActiveCourseEdition(),
  ]);

  const featureId = parsePositiveInteger(formData.get("featureId"));
  const rating = parseRating(formData.get("rating"));
  const intent = parseIntent(formData.get("intent"));

  if (!currentSession || !activeEdition) {
    return {
      ...previousState,
      status: "error",
      message:
        "Your session or the active course edition is no longer valid. Return to the homepage and sign in again.",
    };
  }

  if (!featureId) {
    return {
      ...previousState,
      status: "error",
      message: "The selected feature rating is not valid.",
    };
  }

  const [feature, votingSettings] = await Promise.all([
    prisma.productFeature.findFirst({
      where: {
        id: featureId,
        product: {
          status: "PUBLISHED",
          group: {
            editionId: activeEdition.id,
          },
        },
      },
      select: {
        id: true,
        productId: true,
        product: {
          select: {
            groupId: true,
          },
        },
      },
    }),
    prisma.votingSettings.findUnique({
      where: {
        editionId: activeEdition.id,
      },
      select: {
        isOpen: true,
      },
    }),
  ]);

  if (!feature) {
    return {
      ...previousState,
      status: "error",
      message:
        "This feature is not available for voting in the active edition.",
    };
  }

  const votingOpen = votingSettings?.isOpen ?? false;
  const isOwnProduct = feature.product.groupId === currentSession.member.groupId;

  if (intent === "WITHDRAW") {
    if (!votingOpen && !isOwnProduct) {
      const summary = await getFeatureRatingSummary(feature.id);

      return {
        ...previousState,
        ...summary,
        status: "error",
        message: "Voting is currently closed.",
        votingOpen: false,
        isOwnProduct,
      };
    }

    const existingRating = await prisma.featureRating.findUnique({
      where: {
        featureId_memberId: {
          featureId: feature.id,
          memberId: currentSession.member.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingRating) {
      await prisma.featureRating.delete({
        where: {
          id: existingRating.id,
        },
      });
    }

    const summary = await getFeatureRatingSummary(feature.id);

    revalidatePath(`/catalogo/${feature.productId}`);

    return {
      status: "success",
      message: existingRating
        ? "Your feature rating has been withdrawn."
        : "You had no active feature rating to withdraw.",
      featureId: feature.id,
      currentRating: null,
      averageRating: summary.averageRating,
      ratingCount: summary.ratingCount,
      votingOpen,
      isOwnProduct,
    };
  }

  if (!votingOpen) {
    const summary = await getFeatureRatingSummary(feature.id);

    return {
      ...previousState,
      ...summary,
      status: "error",
      message: "Voting is currently closed.",
      votingOpen: false,
      isOwnProduct,
    };
  }

  if (isOwnProduct) {
    const summary = await getFeatureRatingSummary(feature.id);

    return {
      ...previousState,
      ...summary,
      status: "error",
      message: "Your group cannot rate features of its own product.",
      votingOpen: true,
      isOwnProduct,
    };
  }

  if (!rating) {
    return {
      ...previousState,
      status: "error",
      message: "The selected feature rating is not valid.",
      isOwnProduct,
    };
  }

  await prisma.featureRating.upsert({
    where: {
      featureId_memberId: {
        featureId: feature.id,
        memberId: currentSession.member.id,
      },
    },
    update: {
      rating,
    },
    create: {
      featureId: feature.id,
      memberId: currentSession.member.id,
      rating,
    },
  });

  const summary = await getFeatureRatingSummary(feature.id);

  revalidatePath(`/catalogo/${feature.productId}`);

  return {
    status: "success",
    message: "Your feature rating has been saved.",
    featureId: feature.id,
    currentRating: rating,
    averageRating: summary.averageRating,
    ratingCount: summary.ratingCount,
    votingOpen: true,
    isOwnProduct,
  };
}
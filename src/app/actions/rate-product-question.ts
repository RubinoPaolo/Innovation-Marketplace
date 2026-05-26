'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentSession } from "@/lib/student-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

export type ProductQuestionRatingState = {
  status: "idle" | "success" | "error";
  message: string;
  productId: number;
  questionId: number;
  currentRating: number | null;
  averageRating: number | null;
  ratingCount: number;
  votingOpen: boolean;
  isOwnProduct: boolean;
};

type ProductQuestionRatingIntent = "SAVE" | "WITHDRAW";

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

function parseIntent(
  value: FormDataEntryValue | null,
): ProductQuestionRatingIntent {
  const normalizedValue = String(value ?? "").trim().toUpperCase();

  if (normalizedValue === "WITHDRAW") {
    return "WITHDRAW";
  }

  return "SAVE";
}

async function getQuestionRatingSummary(
  productId: number,
  questionId: number,
): Promise<{
  averageRating: number | null;
  ratingCount: number;
}> {
  const aggregate = await prisma.productQuestionRating.aggregate({
    where: {
      productId,
      questionId,
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

export async function rateProductQuestion(
  previousState: ProductQuestionRatingState,
  formData: FormData,
): Promise<ProductQuestionRatingState> {
  const [currentSession, activeEdition] = await Promise.all([
    getCurrentStudentSession(),
    getActiveCourseEdition(),
  ]);

  const productId = parsePositiveInteger(formData.get("productId"));
  const questionId = parsePositiveInteger(formData.get("questionId"));
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

  if (!productId || !questionId) {
    return {
      ...previousState,
      status: "error",
      message: "The selected evaluation rating is not valid.",
    };
  }

  const [product, question, votingSettings] = await Promise.all([
    prisma.product.findFirst({
      where: {
        id: productId,
        status: "PUBLISHED",
        group: {
          editionId: activeEdition.id,
        },
      },
      select: {
        id: true,
        groupId: true,
      },
    }),
    prisma.evaluationQuestion.findFirst({
      where: {
        id: questionId,
        isActive: true,
      },
      select: {
        id: true,
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

  if (!product || !question) {
    return {
      ...previousState,
      status: "error",
      message:
        "This evaluation question is not available for the selected product.",
    };
  }

  const votingOpen = votingSettings?.isOpen ?? false;
  const isOwnProduct = product.groupId === currentSession.member.groupId;

  if (intent === "WITHDRAW") {
    if (!votingOpen && !isOwnProduct) {
      const summary = await getQuestionRatingSummary(product.id, question.id);

      return {
        ...previousState,
        ...summary,
        status: "error",
        message: "Voting is currently closed.",
        votingOpen: false,
        isOwnProduct,
      };
    }

    const existingRating = await prisma.productQuestionRating.findUnique({
      where: {
        productId_memberId_questionId: {
          productId: product.id,
          memberId: currentSession.member.id,
          questionId: question.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingRating) {
      await prisma.productQuestionRating.delete({
        where: {
          id: existingRating.id,
        },
      });
    }

    const summary = await getQuestionRatingSummary(product.id, question.id);

    revalidatePath(`/catalogo/${product.id}`);

    return {
      status: "success",
      message: existingRating
        ? "Your evaluation rating has been withdrawn."
        : "You had no active evaluation rating to withdraw.",
      productId: product.id,
      questionId: question.id,
      currentRating: null,
      averageRating: summary.averageRating,
      ratingCount: summary.ratingCount,
      votingOpen,
      isOwnProduct,
    };
  }

  if (!votingOpen) {
    const summary = await getQuestionRatingSummary(product.id, question.id);

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
    const summary = await getQuestionRatingSummary(product.id, question.id);

    return {
      ...previousState,
      ...summary,
      status: "error",
      message: "Your group cannot evaluate its own product.",
      votingOpen: true,
      isOwnProduct,
    };
  }

  if (!rating) {
    return {
      ...previousState,
      status: "error",
      message: "The selected evaluation rating is not valid.",
      isOwnProduct,
    };
  }

  await prisma.productQuestionRating.upsert({
    where: {
      productId_memberId_questionId: {
        productId: product.id,
        memberId: currentSession.member.id,
        questionId: question.id,
      },
    },
    update: {
      rating,
    },
    create: {
      productId: product.id,
      memberId: currentSession.member.id,
      questionId: question.id,
      rating,
    },
  });

  const summary = await getQuestionRatingSummary(product.id, question.id);

  revalidatePath(`/catalogo/${product.id}`);

  return {
    status: "success",
    message: "Your evaluation rating has been saved.",
    productId: product.id,
    questionId: question.id,
    currentRating: rating,
    averageRating: summary.averageRating,
    ratingCount: summary.ratingCount,
    votingOpen: true,
    isOwnProduct,
  };
}
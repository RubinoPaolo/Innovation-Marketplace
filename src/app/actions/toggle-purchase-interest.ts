'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentSession } from "@/lib/student-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

export type PurchaseInterestState = {
  status: "idle" | "success" | "error";
  message: string;
  isInterested: boolean;
  interestedCount: number;
  votingOpen: boolean;
};

function parseProductId(value: FormDataEntryValue | null): number | null {
  const productId = Number(String(value ?? "").trim());

  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }

  return productId;
}

async function countProductInterests(productId: number): Promise<number> {
  return prisma.purchaseInterest.count({
    where: {
      productId,
    },
  });
}

export async function togglePurchaseInterest(
  previousState: PurchaseInterestState,
  formData: FormData,
): Promise<PurchaseInterestState> {
  const [currentSession, activeEdition] = await Promise.all([
    getCurrentStudentSession(),
    getActiveCourseEdition(),
  ]);

  const productId = parseProductId(formData.get("productId"));

  if (!currentSession || !activeEdition) {
    return {
      ...previousState,
      status: "error",
      message:
        "Your session or the active course edition is no longer valid. Return to the homepage and sign in again.",
    };
  }

  if (!productId) {
    return {
      ...previousState,
      status: "error",
      message: "The selected product is not valid.",
    };
  }

  const [product, votingSettings] = await Promise.all([
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
        title: true,
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

  if (!product) {
    return {
      ...previousState,
      status: "error",
      message:
        "This product is not available for voting in the active edition.",
    };
  }

  const votingOpen = votingSettings?.isOpen ?? false;

  if (!votingOpen) {
    const interestedCount = await countProductInterests(product.id);

    return {
      status: "error",
      message: "Voting is currently closed.",
      isInterested: previousState.isInterested,
      interestedCount,
      votingOpen: false,
    };
  }

  const existingInterest = await prisma.purchaseInterest.findUnique({
    where: {
      productId_memberId: {
        productId: product.id,
        memberId: currentSession.member.id,
      },
    },
    select: {
      id: true,
    },
  });

  let isInterested: boolean;
  let message: string;

  if (existingInterest) {
    await prisma.purchaseInterest.delete({
      where: {
        id: existingInterest.id,
      },
    });

    isInterested = false;
    message = "Your purchase interest has been removed.";
  } else {
    await prisma.purchaseInterest.create({
      data: {
        productId: product.id,
        memberId: currentSession.member.id,
      },
    });

    isInterested = true;
    message = "Your purchase interest has been recorded.";
  }

  const interestedCount = await countProductInterests(product.id);

  revalidatePath("/catalogo");
  revalidatePath("/leaderboard");
  revalidatePath(`/catalogo/${product.id}`);

  return {
    status: "success",
    message,
    isInterested,
    interestedCount,
    votingOpen: true,
  };
}
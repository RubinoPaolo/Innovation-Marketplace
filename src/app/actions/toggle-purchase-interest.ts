'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentSession } from "@/lib/student-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

export type PurchaseDecision = "YES" | "NO";

export type PurchaseInterestState = {
  status: "idle" | "success" | "error";
  message: string;
  decision: PurchaseDecision | null;
  reason: string;
  yesCount: number;
  noCount: number;
  votingOpen: boolean;
};

type PurchaseInterestIntent = "SAVE" | "WITHDRAW";

function parseProductId(value: FormDataEntryValue | null): number | null {
  const productId = Number(String(value ?? "").trim());

  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }

  return productId;
}

function parseDecision(
  value: FormDataEntryValue | null,
): PurchaseDecision | null {
  const normalizedValue = String(value ?? "").trim().toUpperCase();

  if (normalizedValue === "YES" || normalizedValue === "NO") {
    return normalizedValue;
  }

  return null;
}

function parseReason(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function parseIntent(
  value: FormDataEntryValue | null,
): PurchaseInterestIntent {
  const normalizedValue = String(value ?? "").trim().toUpperCase();

  if (normalizedValue === "WITHDRAW") {
    return "WITHDRAW";
  }

  return "SAVE";
}

async function countProductResponses(productId: number): Promise<{
  yesCount: number;
  noCount: number;
}> {
  const [yesCount, noCount] = await Promise.all([
    prisma.purchaseInterest.count({
      where: {
        productId,
        decision: "YES",
      },
    }),
    prisma.purchaseInterest.count({
      where: {
        productId,
        decision: "NO",
      },
    }),
  ]);

  return {
    yesCount,
    noCount,
  };
}

function revalidateProductVotingPages(productId: number): void {
  revalidatePath("/catalogo");
  revalidatePath("/leaderboard");
  revalidatePath(`/catalogo/${productId}`);
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
  const decision = parseDecision(formData.get("decision"));
  const reason = parseReason(formData.get("reason"));
  const intent = parseIntent(formData.get("intent"));

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
    const counts = await countProductResponses(product.id);

    return {
      ...previousState,
      ...counts,
      status: "error",
      message: "Voting is currently closed.",
      votingOpen: false,
    };
  }

  if (intent === "WITHDRAW") {
    const existingVote = await prisma.purchaseInterest.findUnique({
      where: {
        productId_groupId: {
          productId: product.id,
          groupId: currentSession.member.groupId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingVote) {
      await prisma.purchaseInterest.delete({
        where: {
          id: existingVote.id,
        },
      });
    }

    const counts = await countProductResponses(product.id);

    revalidateProductVotingPages(product.id);

    return {
      status: "success",
      message: existingVote
        ? "Your group's vote has been withdrawn."
        : "Your group had no active vote to withdraw.",
      decision: null,
      reason: "",
      yesCount: counts.yesCount,
      noCount: counts.noCount,
      votingOpen: true,
    };
  }

  if (!decision) {
    return {
      ...previousState,
      status: "error",
      message: "Choose either Yes or No before saving your group's feedback.",
    };
  }

  if (reason.length > 800) {
    return {
      ...previousState,
      status: "error",
      message: "The optional explanation must be 800 characters or fewer.",
    };
  }

  await prisma.purchaseInterest.upsert({
    where: {
      productId_groupId: {
        productId: product.id,
        groupId: currentSession.member.groupId,
      },
    },
    update: {
      memberId: currentSession.member.id,
      decision,
      reason: reason || null,
    },
    create: {
      productId: product.id,
      groupId: currentSession.member.groupId,
      memberId: currentSession.member.id,
      decision,
      reason: reason || null,
    },
  });

  const counts = await countProductResponses(product.id);

  revalidateProductVotingPages(product.id);

  return {
    status: "success",
    message: "Your group's feedback has been saved.",
    decision,
    reason,
    yesCount: counts.yesCount,
    noCount: counts.noCount,
    votingOpen: true,
  };
}
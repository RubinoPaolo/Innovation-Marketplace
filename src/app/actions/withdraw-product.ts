'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentSession } from "@/lib/student-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

export type WithdrawProductState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function withdrawProduct(
  _previousState: WithdrawProductState,
  _formData: FormData,
): Promise<WithdrawProductState> {
  const [currentSession, activeEdition] = await Promise.all([
    getCurrentStudentSession(),
    getActiveCourseEdition(),
  ]);

  if (!currentSession) {
    return {
      status: "error",
      message:
        "Your student session is no longer valid. Return to the homepage and sign in again.",
    };
  }

  if (!activeEdition) {
    return {
      status: "error",
      message: "No active course edition is currently configured.",
    };
  }

  const product = await prisma.product.findFirst({
    where: {
      groupId: currentSession.member.group.id,
      group: {
        editionId: activeEdition.id,
        isActive: true,
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
    },
  });

  if (!product) {
    return {
      status: "error",
      message: "No product is currently available for your group.",
    };
  }

  if (product.status !== "PUBLISHED") {
    return {
      status: "error",
      message: "Only a published product can be withdrawn.",
    };
  }

  await prisma.product.update({
    where: {
      id: product.id,
    },
    data: {
      status: "DRAFT",
    },
  });

  revalidatePath("/");
  revalidatePath("/area-gruppo");
  revalidatePath("/area-gruppo/media");
  revalidatePath("/catalogo");
  revalidatePath("/leaderboard");

  return {
    status: "success",
    message: `"${product.title}" has been withdrawn from the public catalog and returned to draft status.`,
  };
}
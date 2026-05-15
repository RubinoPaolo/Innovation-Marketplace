'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentSession } from "@/lib/student-session";

export type ProductPublicationState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function toggleProductPublication(
  _previousState: ProductPublicationState,
): Promise<ProductPublicationState> {
  const currentSession = await getCurrentStudentSession();

  if (!currentSession) {
    return {
      status: "error",
      message: "Your session is no longer valid. Return to the homepage and sign in again.",
    };
  }

  const product = await prisma.product.findUnique({
    where: {
      groupId: currentSession.member.groupId,
    },
    select: {
      id: true,
      status: true,
      title: true,
    },
  });

  if (!product) {
    return {
      status: "error",
      message: "Create and save the product draft before publishing it.",
    };
  }

  const nextStatus = product.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

  await prisma.product.update({
    where: {
      id: product.id,
    },
    data: {
      status: nextStatus,
    },
  });

  revalidatePath("/area-gruppo");
  revalidatePath("/area-gruppo/media");
  revalidatePath("/catalogo");

  return {
    status: "success",
    message:
      nextStatus === "PUBLISHED"
        ? `${product.title} is now published in the catalog.`
        : `${product.title} has been moved back to draft.`,
  };
}

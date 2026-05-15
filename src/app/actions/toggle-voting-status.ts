'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/admin-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

export type VotingStatusState = {
  status: "idle" | "success" | "error";
  message: string;
  isOpen: boolean;
};

export async function toggleVotingStatus(
  previousState: VotingStatusState,
  _formData: FormData,
): Promise<VotingStatusState> {
  const [adminSession, activeEdition] = await Promise.all([
    getCurrentAdminSession(),
    getActiveCourseEdition(),
  ]);

  if (!adminSession) {
    return {
      ...previousState,
      status: "error",
      message: "Admin session expired. Sign in again.",
    };
  }

  if (!activeEdition) {
    return {
      ...previousState,
      status: "error",
      message: "No active course edition is configured.",
    };
  }

  const currentSettings = await prisma.votingSettings.findUnique({
    where: {
      editionId: activeEdition.id,
    },
    select: {
      id: true,
      isOpen: true,
    },
  });

  if (!currentSettings) {
    const createdSettings = await prisma.votingSettings.create({
      data: {
        editionId: activeEdition.id,
        isOpen: true,
      },
      select: {
        isOpen: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/catalogo");
    revalidatePath("/leaderboard");

    return {
      status: "success",
      message: "Voting has been opened.",
      isOpen: createdSettings.isOpen,
    };
  }

  const updatedSettings = await prisma.votingSettings.update({
    where: {
      id: currentSettings.id,
    },
    data: {
      isOpen: !currentSettings.isOpen,
    },
    select: {
      isOpen: true,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/catalogo");
  revalidatePath("/leaderboard");

  return {
    status: "success",
    message: updatedSettings.isOpen
      ? "Voting has been opened."
      : "Voting has been closed.",
    isOpen: updatedSettings.isOpen,
  };
}
'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/admin-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

export type AdminHomeNoticeActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const ALLOWED_NOTICE_LEVELS = new Set(["INFO", "IMPORTANT", "WARNING"]);

function normalizeText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeMultilineText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function parsePositiveInteger(
  value: FormDataEntryValue | null,
): number | null {
  const parsedValue = Number(String(value ?? "").trim());

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function parseNoticeLevel(value: FormDataEntryValue | null): string | null {
  const level = String(value ?? "").trim().toUpperCase();

  if (!ALLOWED_NOTICE_LEVELS.has(level)) {
    return null;
  }

  return level;
}

function parsePublished(value: FormDataEntryValue | null): boolean {
  return value === "on";
}

async function requireAdminAndActiveEdition() {
  const [adminSession, activeEdition] = await Promise.all([
    getCurrentAdminSession(),
    getActiveCourseEdition(),
  ]);

  if (!adminSession) {
    return {
      error: "Admin session expired. Sign in again.",
      edition: null,
    };
  }

  if (!activeEdition) {
    return {
      error: "No active course edition is configured.",
      edition: null,
    };
  }

  return {
    error: null,
    edition: activeEdition,
  };
}

function revalidateNoticePages(): void {
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createHomeNotice(
  _previousState: AdminHomeNoticeActionState,
  formData: FormData,
): Promise<AdminHomeNoticeActionState> {
  const { error, edition } = await requireAdminAndActiveEdition();

  if (error || !edition) {
    return {
      status: "error",
      message: error ?? "Unable to create the notice.",
    };
  }

  const title = normalizeText(formData.get("title"));
  const message = normalizeMultilineText(formData.get("message"));
  const level = parseNoticeLevel(formData.get("level"));
  const isPublished = parsePublished(formData.get("isPublished"));

  if (!title) {
    return {
      status: "error",
      message: "Enter a title for the notice.",
    };
  }

  if (title.length > 120) {
    return {
      status: "error",
      message: "The notice title must be 120 characters or fewer.",
    };
  }

  if (!message) {
    return {
      status: "error",
      message: "Enter the notice text.",
    };
  }

  if (message.length > 800) {
    return {
      status: "error",
      message: "The notice text must be 800 characters or fewer.",
    };
  }

  if (!level) {
    return {
      status: "error",
      message: "Choose a valid notice type.",
    };
  }

  await prisma.homeNotice.create({
    data: {
      editionId: edition.id,
      title,
      message,
      level,
      isPublished,
    },
  });

  revalidateNoticePages();

  return {
    status: "success",
    message: "Notice created successfully.",
  };
}

export async function updateHomeNotice(
  _previousState: AdminHomeNoticeActionState,
  formData: FormData,
): Promise<AdminHomeNoticeActionState> {
  const { error, edition } = await requireAdminAndActiveEdition();

  if (error || !edition) {
    return {
      status: "error",
      message: error ?? "Unable to update the notice.",
    };
  }

  const noticeId = parsePositiveInteger(formData.get("noticeId"));
  const title = normalizeText(formData.get("title"));
  const message = normalizeMultilineText(formData.get("message"));
  const level = parseNoticeLevel(formData.get("level"));
  const isPublished = parsePublished(formData.get("isPublished"));

  if (!noticeId) {
    return {
      status: "error",
      message: "The selected notice is not valid.",
    };
  }

  const notice = await prisma.homeNotice.findFirst({
    where: {
      id: noticeId,
      editionId: edition.id,
    },
    select: {
      id: true,
    },
  });

  if (!notice) {
    return {
      status: "error",
      message: "The selected notice no longer exists.",
    };
  }

  if (!title) {
    return {
      status: "error",
      message: "Enter a title for the notice.",
    };
  }

  if (title.length > 120) {
    return {
      status: "error",
      message: "The notice title must be 120 characters or fewer.",
    };
  }

  if (!message) {
    return {
      status: "error",
      message: "Enter the notice text.",
    };
  }

  if (message.length > 800) {
    return {
      status: "error",
      message: "The notice text must be 800 characters or fewer.",
    };
  }

  if (!level) {
    return {
      status: "error",
      message: "Choose a valid notice type.",
    };
  }

  await prisma.homeNotice.update({
    where: {
      id: notice.id,
    },
    data: {
      title,
      message,
      level,
      isPublished,
    },
  });

  revalidateNoticePages();

  return {
    status: "success",
    message: "Notice updated successfully.",
  };
}

export async function deleteHomeNotice(
  _previousState: AdminHomeNoticeActionState,
  formData: FormData,
): Promise<AdminHomeNoticeActionState> {
  const { error, edition } = await requireAdminAndActiveEdition();

  if (error || !edition) {
    return {
      status: "error",
      message: error ?? "Unable to delete the notice.",
    };
  }

  const noticeId = parsePositiveInteger(formData.get("noticeId"));

  if (!noticeId) {
    return {
      status: "error",
      message: "The selected notice is not valid.",
    };
  }

  const notice = await prisma.homeNotice.findFirst({
    where: {
      id: noticeId,
      editionId: edition.id,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!notice) {
    return {
      status: "error",
      message: "The selected notice no longer exists.",
    };
  }

  await prisma.homeNotice.delete({
    where: {
      id: notice.id,
    },
  });

  revalidateNoticePages();

  return {
    status: "success",
    message: `Notice "${notice.title}" deleted successfully.`,
  };
}
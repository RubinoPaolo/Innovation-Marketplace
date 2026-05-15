'use server';

import { timingSafeEqual } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/admin-session";

export type AdminCourseEditionActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function normalizeText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function parsePositiveInteger(value: FormDataEntryValue | null): number | null {
  const parsedValue = Number(String(value ?? "").trim());

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function passwordsMatch(
  submittedPassword: string,
  configuredPassword: string,
): boolean {
  const submittedBuffer = Buffer.from(submittedPassword);
  const configuredBuffer = Buffer.from(configuredPassword);

  if (submittedBuffer.length !== configuredBuffer.length) {
    return false;
  }

  return timingSafeEqual(submittedBuffer, configuredBuffer);
}

async function requireAdminSession(): Promise<string | null> {
  const adminSession = await getCurrentAdminSession();

  if (!adminSession) {
    return "Admin session expired. Sign in again.";
  }

  return null;
}

async function removeStoredFile(imageUrl: string): Promise<void> {
  if (!imageUrl.startsWith("/uploads/products/")) {
    return;
  }

  const relativePath = imageUrl.slice(1);
  const absolutePath = path.join(process.cwd(), "public", relativePath);

  try {
    await unlink(absolutePath);
  } catch {
    // Edition deletion should still succeed if a physical image file is already missing.
  }
}

function revalidateEditionAwarePages(): void {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/editions");
  revalidatePath("/admin/groups");
  revalidatePath("/admin/group-requests");
  revalidatePath("/area-gruppo");
  revalidatePath("/catalogo");
  revalidatePath("/leaderboard");
}

export async function createCourseEdition(
  _previousState: AdminCourseEditionActionState,
  formData: FormData,
): Promise<AdminCourseEditionActionState> {
  const adminError = await requireAdminSession();

  if (adminError) {
    return {
      status: "error",
      message: adminError,
    };
  }

  const name = normalizeText(formData.get("name"));
  const academicYear = normalizeText(formData.get("academicYear"));

  if (!name) {
    return {
      status: "error",
      message: "Enter the course edition name.",
    };
  }

  if (!academicYear) {
    return {
      status: "error",
      message: "Enter the academic year.",
    };
  }

  const existingEditionWithSameName = await prisma.courseEdition.findFirst({
    where: {
      name,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (existingEditionWithSameName) {
    return {
      status: "error",
      message: "An edition with this name already exists.",
    };
  }

  await prisma.courseEdition.create({
    data: {
      name,
      academicYear,
      isActive: false,
      votingSettings: {
        create: {
          isOpen: false,
        },
      },
    },
  });

  revalidateEditionAwarePages();

  return {
    status: "success",
    message:
      "Course edition created successfully. It is inactive until you activate it.",
  };
}

export async function activateCourseEdition(
  _previousState: AdminCourseEditionActionState,
  formData: FormData,
): Promise<AdminCourseEditionActionState> {
  const adminError = await requireAdminSession();

  if (adminError) {
    return {
      status: "error",
      message: adminError,
    };
  }

  const editionId = parsePositiveInteger(formData.get("editionId"));

  if (!editionId) {
    return {
      status: "error",
      message: "The selected edition is not valid.",
    };
  }

  const edition = await prisma.courseEdition.findUnique({
    where: {
      id: editionId,
    },
    select: {
      id: true,
      name: true,
      isActive: true,
      votingSettings: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!edition) {
    return {
      status: "error",
      message: "The selected edition no longer exists.",
    };
  }

  if (edition.isActive) {
    return {
      status: "success",
      message: `${edition.name} is already the active edition.`,
    };
  }

  await prisma.$transaction([
    prisma.courseEdition.updateMany({
      where: {
        isActive: true,
      },
      data: {
        isActive: false,
      },
    }),
    prisma.courseEdition.update({
      where: {
        id: edition.id,
      },
      data: {
        isActive: true,
      },
    }),
    ...(edition.votingSettings
      ? [
          prisma.votingSettings.update({
            where: {
              editionId: edition.id,
            },
            data: {
              isOpen: false,
            },
          }),
        ]
      : [
          prisma.votingSettings.create({
            data: {
              editionId: edition.id,
              isOpen: false,
            },
          }),
        ]),
  ]);

  revalidateEditionAwarePages();

  return {
    status: "success",
    message: `${edition.name} is now active. Voting has been set to closed.`,
  };
}

export async function deleteCourseEdition(
  _previousState: AdminCourseEditionActionState,
  formData: FormData,
): Promise<AdminCourseEditionActionState> {
  const adminError = await requireAdminSession();

  if (adminError) {
    return {
      status: "error",
      message: adminError,
    };
  }

  const editionId = parsePositiveInteger(formData.get("editionId"));
  const adminPassword = String(formData.get("adminPassword") ?? "");
  const configuredAdminPassword = process.env.ADMIN_PASSWORD;

  if (!editionId) {
    return {
      status: "error",
      message: "The selected edition is not valid.",
    };
  }

  if (!configuredAdminPassword) {
    return {
      status: "error",
      message: "ADMIN_PASSWORD is not configured in the environment.",
    };
  }

  if (!adminPassword) {
    return {
      status: "error",
      message: "Enter the admin password to confirm deletion.",
    };
  }

  if (!passwordsMatch(adminPassword, configuredAdminPassword)) {
    return {
      status: "error",
      message: "The admin password is not correct.",
    };
  }

  const edition = await prisma.courseEdition.findUnique({
    where: {
      id: editionId,
    },
    select: {
      id: true,
      name: true,
      isActive: true,
      groups: {
        select: {
          product: {
            select: {
              images: {
                select: {
                  imageUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!edition) {
    return {
      status: "error",
      message: "The selected edition no longer exists.",
    };
  }

  const imageUrls = edition.groups.flatMap((group) =>
    group.product?.images.map((image) => image.imageUrl) ?? [],
  );

  await Promise.all(imageUrls.map((imageUrl) => removeStoredFile(imageUrl)));

  await prisma.courseEdition.delete({
    where: {
      id: edition.id,
    },
  });

  revalidateEditionAwarePages();

  return {
    status: "success",
    message: edition.isActive
      ? `${edition.name} has been permanently deleted. It was the active edition, so the platform now has no active edition until another one is activated.`
      : `${edition.name} has been permanently deleted.`,
  };
}
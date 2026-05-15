'use server';

import { unlink } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/admin-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

export type AdminGroupActionState = {
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

function slugify(value: string): string {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseStudentNumbers(value: FormDataEntryValue | null): string[] {
  const rawValue = String(value ?? "");

  return [
    ...new Set(
      rawValue
        .split(/[\n,;]+/)
        .map((studentNumber) => studentNumber.trim())
        .filter(Boolean),
    ),
  ];
}

async function requireAdminContext() {
  const [adminSession, activeEdition] = await Promise.all([
    getCurrentAdminSession(),
    getActiveCourseEdition(),
  ]);

  if (!adminSession) {
    return {
      error: "Admin session expired. Sign in again.",
      activeEdition: null,
    };
  }

  if (!activeEdition) {
    return {
      error: "No active course edition is configured.",
      activeEdition: null,
    };
  }

  return {
    error: null,
    activeEdition,
  };
}

async function removeStoredFile(imageUrl: string): Promise<void> {
  if (!imageUrl.startsWith("/uploads/products/")) {
    return;
  }

  const relativePath = imageUrl.replace(/^\/+/, "");
  const absolutePath = path.join(process.cwd(), "public", relativePath);

  try {
    await unlink(absolutePath);
  } catch {
    // Group deletion should still succeed if the physical image file is missing.
  }
}

export async function createAdminGroup(
  _previousState: AdminGroupActionState,
  formData: FormData,
): Promise<AdminGroupActionState> {
  const groupName = normalizeText(formData.get("groupName"));
  const studentNumbers = parseStudentNumbers(formData.get("studentNumbers"));
  const context = await requireAdminContext();

  if (context.error || !context.activeEdition) {
    return {
      status: "error",
      message: context.error ?? "Unable to validate the admin context.",
    };
  }

  if (!groupName) {
    return {
      status: "error",
      message: "Enter a group name.",
    };
  }

  if (studentNumbers.length === 0) {
    return {
      status: "error",
      message: "Enter at least one student ID.",
    };
  }

  const generatedSlug = slugify(groupName);

  if (!generatedSlug) {
    return {
      status: "error",
      message: "The group name must contain at least one letter or number.",
    };
  }

  const [
    conflictingGroupName,
    conflictingGroupSlug,
    alreadyRegisteredMembers,
  ] = await Promise.all([
    prisma.group.findFirst({
      where: {
        editionId: context.activeEdition.id,
        name: groupName,
      },
      select: {
        id: true,
      },
    }),
    prisma.group.findFirst({
      where: {
        editionId: context.activeEdition.id,
        slug: generatedSlug,
      },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.groupMember.findMany({
      where: {
        editionId: context.activeEdition.id,
        studentNumber: {
          in: studentNumbers,
        },
      },
      select: {
        studentNumber: true,
      },
    }),
  ]);

  if (conflictingGroupName) {
    return {
      status: "error",
      message: "A group with this name already exists in the active edition.",
    };
  }

  if (conflictingGroupSlug) {
    return {
      status: "error",
      message: `The proposed name generates the same internal slug as group ${conflictingGroupSlug.name}. Choose a slightly different name.`,
    };
  }

  if (alreadyRegisteredMembers.length > 0) {
    return {
      status: "error",
      message: `These student IDs are already registered in the active edition: ${alreadyRegisteredMembers
        .map((member) => member.studentNumber)
        .join(", ")}.`,
    };
  }

  await prisma.group.create({
    data: {
      editionId: context.activeEdition.id,
      name: groupName,
      slug: generatedSlug,
      isActive: true,
      members: {
        create: studentNumbers.map((studentNumber) => ({
          editionId: context.activeEdition.id,
          studentNumber,
          isActive: true,
        })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/groups");

  return {
    status: "success",
    message: `Group ${groupName} created successfully with ${studentNumbers.length} student ID${studentNumbers.length === 1 ? "" : "s"}.`,
  };
}

export async function renameGroup(
  _previousState: AdminGroupActionState,
  formData: FormData,
): Promise<AdminGroupActionState> {
  const groupId = parsePositiveInteger(formData.get("groupId"));
  const groupName = normalizeText(formData.get("groupName"));
  const context = await requireAdminContext();

  if (context.error || !context.activeEdition) {
    return {
      status: "error",
      message: context.error ?? "Unable to validate the admin context.",
    };
  }

  if (!groupId) {
    return {
      status: "error",
      message: "The selected group is not valid.",
    };
  }

  if (!groupName) {
    return {
      status: "error",
      message: "Enter a group name.",
    };
  }

  const existingGroup = await prisma.group.findFirst({
    where: {
      id: groupId,
      editionId: context.activeEdition.id,
    },
    select: {
      id: true,
    },
  });

  if (!existingGroup) {
    return {
      status: "error",
      message: "The selected group does not belong to the active edition.",
    };
  }

  const conflictingGroup = await prisma.group.findFirst({
    where: {
      editionId: context.activeEdition.id,
      name: groupName,
      id: {
        not: groupId,
      },
    },
    select: {
      id: true,
    },
  });

  if (conflictingGroup) {
    return {
      status: "error",
      message: "Another group in the active edition already uses this name.",
    };
  }

  await prisma.group.update({
    where: {
      id: groupId,
    },
    data: {
      name: groupName,
      slug: slugify(groupName),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${groupId}`);
  revalidatePath("/area-gruppo");
  revalidatePath("/catalogo");
  revalidatePath("/leaderboard");

  return {
    status: "success",
    message: "Group name updated successfully.",
  };
}

export async function addGroupMembers(
  _previousState: AdminGroupActionState,
  formData: FormData,
): Promise<AdminGroupActionState> {
  const groupId = parsePositiveInteger(formData.get("groupId"));
  const studentNumbers = parseStudentNumbers(formData.get("studentNumbers"));
  const context = await requireAdminContext();

  if (context.error || !context.activeEdition) {
    return {
      status: "error",
      message: context.error ?? "Unable to validate the admin context.",
    };
  }

  if (!groupId) {
    return {
      status: "error",
      message: "The selected group is not valid.",
    };
  }

  if (studentNumbers.length === 0) {
    return {
      status: "error",
      message: "Enter at least one student ID.",
    };
  }

  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      editionId: context.activeEdition.id,
    },
    select: {
      id: true,
    },
  });

  if (!group) {
    return {
      status: "error",
      message: "The selected group does not belong to the active edition.",
    };
  }

  const existingMembers = await prisma.groupMember.findMany({
    where: {
      editionId: context.activeEdition.id,
      studentNumber: {
        in: studentNumbers,
      },
    },
    select: {
      id: true,
      groupId: true,
      studentNumber: true,
      isActive: true,
    },
  });

  const membersAlreadyInAnotherGroup = existingMembers.filter(
    (member) => member.groupId !== groupId,
  );

  if (membersAlreadyInAnotherGroup.length > 0) {
    return {
      status: "error",
      message: `These student IDs already belong to another group in the active edition: ${membersAlreadyInAnotherGroup
        .map((member) => member.studentNumber)
        .join(", ")}.`,
    };
  }

  const existingMembersInCurrentGroup = new Map(
    existingMembers.map((member) => [member.studentNumber, member]),
  );

  const membersToCreate = studentNumbers.filter(
    (studentNumber) => !existingMembersInCurrentGroup.has(studentNumber),
  );

  const membersToReactivate = studentNumbers.filter((studentNumber) => {
    const member = existingMembersInCurrentGroup.get(studentNumber);
    return member && !member.isActive;
  });

  if (membersToCreate.length > 0) {
    await prisma.groupMember.createMany({
      data: membersToCreate.map((studentNumber) => ({
        editionId: context.activeEdition.id,
        groupId,
        studentNumber,
        isActive: true,
      })),
    });
  }

  if (membersToReactivate.length > 0) {
    await prisma.groupMember.updateMany({
      where: {
        editionId: context.activeEdition.id,
        groupId,
        studentNumber: {
          in: membersToReactivate,
        },
      },
      data: {
        isActive: true,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${groupId}`);

  const unchangedMembers = studentNumbers.filter((studentNumber) => {
    const member = existingMembersInCurrentGroup.get(studentNumber);
    return member?.isActive;
  });

  return {
    status: "success",
    message: `Members updated. Added: ${membersToCreate.length}. Reactivated: ${membersToReactivate.length}. Already active: ${unchangedMembers.length}.`,
  };
}

export async function toggleGroupMemberActive(
  _previousState: AdminGroupActionState,
  formData: FormData,
): Promise<AdminGroupActionState> {
  const groupId = parsePositiveInteger(formData.get("groupId"));
  const memberId = parsePositiveInteger(formData.get("memberId"));
  const context = await requireAdminContext();

  if (context.error || !context.activeEdition) {
    return {
      status: "error",
      message: context.error ?? "Unable to validate the admin context.",
    };
  }

  if (!groupId || !memberId) {
    return {
      status: "error",
      message: "The selected group member is not valid.",
    };
  }

  const member = await prisma.groupMember.findFirst({
    where: {
      id: memberId,
      groupId,
      editionId: context.activeEdition.id,
    },
    select: {
      id: true,
      studentNumber: true,
      isActive: true,
    },
  });

  if (!member) {
    return {
      status: "error",
      message: "The selected student does not belong to this group.",
    };
  }

  const nextIsActive = !member.isActive;

  await prisma.groupMember.update({
    where: {
      id: member.id,
    },
    data: {
      isActive: nextIsActive,
    },
  });

  if (!nextIsActive) {
    await prisma.studentSession.deleteMany({
      where: {
        memberId: member.id,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${groupId}`);

  return {
    status: "success",
    message: nextIsActive
      ? `Student ID ${member.studentNumber} has been reactivated.`
      : `Student ID ${member.studentNumber} has been deactivated.`,
  };
}

export async function deleteGroupMember(
  _previousState: AdminGroupActionState,
  formData: FormData,
): Promise<AdminGroupActionState> {
  const groupId = parsePositiveInteger(formData.get("groupId"));
  const memberId = parsePositiveInteger(formData.get("memberId"));
  const context = await requireAdminContext();

  if (context.error || !context.activeEdition) {
    return {
      status: "error",
      message: context.error ?? "Unable to validate the admin context.",
    };
  }

  if (!groupId || !memberId) {
    return {
      status: "error",
      message: "The selected group member is not valid.",
    };
  }

  const member = await prisma.groupMember.findFirst({
    where: {
      id: memberId,
      groupId,
      editionId: context.activeEdition.id,
    },
    select: {
      id: true,
      studentNumber: true,
      _count: {
        select: {
          interests: true,
          sessions: true,
        },
      },
    },
  });

  if (!member) {
    return {
      status: "error",
      message: "The selected student does not belong to this group.",
    };
  }

  await prisma.groupMember.delete({
    where: {
      id: member.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${groupId}`);
  revalidatePath("/catalogo");
  revalidatePath("/leaderboard");

  return {
    status: "success",
    message: `Student ID ${member.studentNumber} has been permanently deleted. Removed purchase-interest votes: ${member._count.interests}. Removed active sessions: ${member._count.sessions}.`,
  };
}

export async function toggleGroupActive(
  _previousState: AdminGroupActionState,
  formData: FormData,
): Promise<AdminGroupActionState> {
  const groupId = parsePositiveInteger(formData.get("groupId"));
  const context = await requireAdminContext();

  if (context.error || !context.activeEdition) {
    return {
      status: "error",
      message: context.error ?? "Unable to validate the admin context.",
    };
  }

  if (!groupId) {
    return {
      status: "error",
      message: "The selected group is not valid.",
    };
  }

  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      editionId: context.activeEdition.id,
    },
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  });

  if (!group) {
    return {
      status: "error",
      message: "The selected group does not belong to the active edition.",
    };
  }

  const nextIsActive = !group.isActive;

  await prisma.group.update({
    where: {
      id: group.id,
    },
    data: {
      isActive: nextIsActive,
    },
  });

  if (!nextIsActive) {
    await prisma.studentSession.deleteMany({
      where: {
        member: {
          groupId: group.id,
        },
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${group.id}`);
  revalidatePath("/catalogo");
  revalidatePath("/leaderboard");

  return {
    status: "success",
    message: nextIsActive
      ? `Group ${group.name} has been reactivated.`
      : `Group ${group.name} has been suspended.`,
  };
}

export async function deleteGroup(formData: FormData): Promise<void> {
  const groupId = parsePositiveInteger(formData.get("groupId"));
  const context = await requireAdminContext();

  if (context.error || !context.activeEdition) {
    redirect("/admin");
  }

  if (!groupId) {
    redirect("/admin/groups");
  }

  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      editionId: context.activeEdition.id,
    },
    select: {
      id: true,
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
  });

  if (!group) {
    redirect("/admin/groups");
  }

  const imageUrls =
    group.product?.images.map((image) => image.imageUrl) ?? [];

  await Promise.all(imageUrls.map((imageUrl) => removeStoredFile(imageUrl)));

  await prisma.group.delete({
    where: {
      id: group.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath("/catalogo");
  revalidatePath("/leaderboard");

  redirect("/admin/groups");
}
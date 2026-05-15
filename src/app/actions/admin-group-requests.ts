'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/admin-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

export type AdminGroupRequestActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function normalizeText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeLongText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function parsePositiveInteger(value: FormDataEntryValue | null): number | null {
  const parsedValue = Number(String(value ?? "").trim());

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
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

function slugify(value: string): string {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

async function validateCreateGroupRequestData({
  editionId,
  groupName,
  studentNumbers,
  ignoredRequestId,
}: {
  editionId: number;
  groupName: string;
  studentNumbers: string[];
  ignoredRequestId?: number;
}): Promise<string | null> {
  if (!groupName) {
    return "Enter a proposed group name.";
  }

  if (studentNumbers.length === 0) {
    return "Enter at least one student ID.";
  }

  const groupSlug = slugify(groupName);

  if (!groupSlug) {
    return "The proposed group name must contain at least one letter or number.";
  }

  const [
    conflictingGroupName,
    conflictingGroupSlug,
    existingMembers,
    conflictingPendingRequest,
  ] = await Promise.all([
    prisma.group.findFirst({
      where: {
        editionId,
        name: groupName,
      },
      select: {
        id: true,
      },
    }),
    prisma.group.findFirst({
      where: {
        editionId,
        slug: groupSlug,
      },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.groupMember.findMany({
      where: {
        editionId,
        studentNumber: {
          in: studentNumbers,
        },
      },
      select: {
        studentNumber: true,
      },
    }),
    prisma.groupRequest.findFirst({
      where: {
        editionId,
        requestType: "CREATE_GROUP",
        status: "PENDING",
        requestedGroupName: groupName,
        ...(ignoredRequestId
          ? {
              id: {
                not: ignoredRequestId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (conflictingGroupName) {
    return "A group with this name already exists in the active edition.";
  }

  if (conflictingGroupSlug) {
    return `The proposed name generates the same internal slug as group ${conflictingGroupSlug.name}. Choose a slightly different name.`;
  }

  if (existingMembers.length > 0) {
    return `These student IDs are already registered in the active edition: ${existingMembers
      .map((member) => member.studentNumber)
      .join(", ")}.`;
  }

  if (conflictingPendingRequest) {
    return "Another pending group request already uses this proposed name.";
  }

  return null;
}

async function validateUpdateGroupRequestData({
  editionId,
  groupId,
  currentGroupName,
  requestedGroupName,
  studentNumbersToAdd,
  studentNumbersToRemove,
}: {
  editionId: number;
  groupId: number;
  currentGroupName: string;
  requestedGroupName: string | null;
  studentNumbersToAdd: string[];
  studentNumbersToRemove: string[];
}): Promise<string | null> {
  const activeMembers = await prisma.groupMember.findMany({
    where: {
      editionId,
      groupId,
      isActive: true,
    },
    select: {
      studentNumber: true,
    },
  });

  const activeMemberNumbers = activeMembers.map(
    (member) => member.studentNumber,
  );

  const overlappingNumbers = studentNumbersToAdd.filter((studentNumber) =>
    studentNumbersToRemove.includes(studentNumber),
  );

  if (overlappingNumbers.length > 0) {
    return `These student IDs cannot be both added and removed in the same request: ${overlappingNumbers.join(", ")}.`;
  }

  const normalizedRequestedGroupName = requestedGroupName
    ? normalizeText(requestedGroupName)
    : "";

  const hasRename =
    normalizedRequestedGroupName.length > 0 &&
    normalizedRequestedGroupName !== currentGroupName;
  const hasAdditions = studentNumbersToAdd.length > 0;
  const hasRemovals = studentNumbersToRemove.length > 0;

  if (!hasRename && !hasAdditions && !hasRemovals) {
    return "Keep at least one real change in the request before saving or approving it.";
  }

  const membersNotInGroup = studentNumbersToRemove.filter(
    (studentNumber) => !activeMemberNumbers.includes(studentNumber),
  );

  if (membersNotInGroup.length > 0) {
    return `These student IDs are not active members of the affected group: ${membersNotInGroup.join(", ")}.`;
  }

  const projectedActiveMemberCount =
    activeMemberNumbers.length -
    studentNumbersToRemove.length +
    studentNumbersToAdd.length;

  if (projectedActiveMemberCount <= 0) {
    return "The update would leave the group without active members. Keep at least one active member after approval.";
  }

  if (hasRename) {
    const requestedSlug = slugify(normalizedRequestedGroupName);

    if (!requestedSlug) {
      return "The requested group name must contain at least one letter or number.";
    }

    const [conflictingGroupName, conflictingGroupSlug] = await Promise.all([
      prisma.group.findFirst({
        where: {
          editionId,
          id: {
            not: groupId,
          },
          name: normalizedRequestedGroupName,
        },
        select: {
          id: true,
        },
      }),
      prisma.group.findFirst({
        where: {
          editionId,
          id: {
            not: groupId,
          },
          slug: requestedSlug,
        },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

    if (conflictingGroupName) {
      return "Another group in the active edition already uses the requested name.";
    }

    if (conflictingGroupSlug) {
      return `The requested name generates the same internal slug as group ${conflictingGroupSlug.name}. Choose a slightly different name.`;
    }
  }

  if (studentNumbersToAdd.length > 0) {
    const existingMembers = await prisma.groupMember.findMany({
      where: {
        editionId,
        studentNumber: {
          in: studentNumbersToAdd,
        },
      },
      select: {
        studentNumber: true,
      },
    });

    if (existingMembers.length > 0) {
      return `These student IDs are already registered in the active edition: ${existingMembers
        .map((member) => member.studentNumber)
        .join(", ")}.`;
    }
  }

  return null;
}

export async function updatePendingGroupRequest(
  _previousState: AdminGroupRequestActionState,
  formData: FormData,
): Promise<AdminGroupRequestActionState> {
  const requestId = parsePositiveInteger(formData.get("requestId"));
  const requestedGroupName = normalizeText(formData.get("requestedGroupName"));
  const studentNumbers = parseStudentNumbers(formData.get("studentNumbers"));
  const adminNote = normalizeLongText(formData.get("adminNote"));
  const context = await requireAdminContext();

  if (context.error || !context.activeEdition) {
    return {
      status: "error",
      message: context.error ?? "Unable to validate the admin context.",
    };
  }

  if (!requestId) {
    return {
      status: "error",
      message: "The selected group request is not valid.",
    };
  }

  const request = await prisma.groupRequest.findFirst({
    where: {
      id: requestId,
      editionId: context.activeEdition.id,
      requestType: "CREATE_GROUP",
      status: "PENDING",
    },
    select: {
      id: true,
    },
  });

  if (!request) {
    return {
      status: "error",
      message: "Only pending creation requests from the active edition can be edited.",
    };
  }

  const validationError = await validateCreateGroupRequestData({
    editionId: context.activeEdition.id,
    groupName: requestedGroupName,
    studentNumbers,
    ignoredRequestId: request.id,
  });

  if (validationError) {
    return {
      status: "error",
      message: validationError,
    };
  }

  await prisma.$transaction([
    prisma.groupRequest.update({
      where: {
        id: request.id,
      },
      data: {
        requestedGroupName,
        adminNote: adminNote || null,
      },
    }),
    prisma.groupRequestMember.deleteMany({
      where: {
        requestId: request.id,
      },
    }),
    prisma.groupRequestMember.createMany({
      data: studentNumbers.map((studentNumber) => ({
        requestId: request.id,
        studentNumber,
        action: "ADD",
      })),
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/group-requests");
  revalidatePath(`/admin/group-requests/${request.id}`);

  return {
    status: "success",
    message: "Pending request updated successfully.",
  };
}

export async function approveCreateGroupRequest(
  _previousState: AdminGroupRequestActionState,
  formData: FormData,
): Promise<AdminGroupRequestActionState> {
  const requestId = parsePositiveInteger(formData.get("requestId"));
  const context = await requireAdminContext();

  if (context.error || !context.activeEdition) {
    return {
      status: "error",
      message: context.error ?? "Unable to validate the admin context.",
    };
  }

  if (!requestId) {
    return {
      status: "error",
      message: "The selected group request is not valid.",
    };
  }

  const request = await prisma.groupRequest.findFirst({
    where: {
      id: requestId,
      editionId: context.activeEdition.id,
      requestType: "CREATE_GROUP",
      status: "PENDING",
    },
    select: {
      id: true,
      requestedGroupName: true,
      adminNote: true,
      members: {
        select: {
          studentNumber: true,
        },
        orderBy: {
          studentNumber: "asc",
        },
      },
    },
  });

  if (!request) {
    return {
      status: "error",
      message: "Only pending creation requests from the active edition can be approved.",
    };
  }

  const groupName = normalizeText(request.requestedGroupName);
  const studentNumbers = request.members.map((member) => member.studentNumber);

  const validationError = await validateCreateGroupRequestData({
    editionId: context.activeEdition.id,
    groupName,
    studentNumbers,
    ignoredRequestId: request.id,
  });

  if (validationError) {
    return {
      status: "error",
      message: `Approval blocked: ${validationError}`,
    };
  }

  const createdGroup = await prisma.group.create({
    data: {
      editionId: context.activeEdition.id,
      name: groupName,
      slug: slugify(groupName),
      isActive: true,
      members: {
        create: studentNumbers.map((studentNumber) => ({
          editionId: context.activeEdition.id,
          studentNumber,
          isActive: true,
        })),
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  await prisma.groupRequest.update({
    where: {
      id: request.id,
    },
    data: {
      status: "APPROVED",
      groupId: createdGroup.id,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath("/admin/group-requests");
  revalidatePath(`/admin/group-requests/${request.id}`);

  return {
    status: "success",
    message: `Request approved. Group ${createdGroup.name} has been created successfully.`,
  };
}

export async function rejectCreateGroupRequest(
  _previousState: AdminGroupRequestActionState,
  formData: FormData,
): Promise<AdminGroupRequestActionState> {
  const requestId = parsePositiveInteger(formData.get("requestId"));
  const adminNote = normalizeLongText(formData.get("adminNote"));
  const context = await requireAdminContext();

  if (context.error || !context.activeEdition) {
    return {
      status: "error",
      message: context.error ?? "Unable to validate the admin context.",
    };
  }

  if (!requestId) {
    return {
      status: "error",
      message: "The selected group request is not valid.",
    };
  }

  const request = await prisma.groupRequest.findFirst({
    where: {
      id: requestId,
      editionId: context.activeEdition.id,
      requestType: "CREATE_GROUP",
      status: "PENDING",
    },
    select: {
      id: true,
    },
  });

  if (!request) {
    return {
      status: "error",
      message: "Only pending creation requests from the active edition can be rejected.",
    };
  }

  await prisma.groupRequest.update({
    where: {
      id: request.id,
    },
    data: {
      status: "REJECTED",
      adminNote: adminNote || null,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/group-requests");
  revalidatePath(`/admin/group-requests/${request.id}`);

  return {
    status: "success",
    message: "Request rejected successfully.",
  };
}

export async function updatePendingGroupUpdateRequest(
  _previousState: AdminGroupRequestActionState,
  formData: FormData,
): Promise<AdminGroupRequestActionState> {
  const requestId = parsePositiveInteger(formData.get("requestId"));
  const requestedGroupNameInput = normalizeText(
    formData.get("requestedGroupName"),
  );
  const studentNumbersToAdd = parseStudentNumbers(
    formData.get("studentNumbersToAdd"),
  );
  const studentNumbersToRemove = parseStudentNumbers(
    formData.get("studentNumbersToRemove"),
  );
  const adminNote = normalizeLongText(formData.get("adminNote"));
  const context = await requireAdminContext();

  if (context.error || !context.activeEdition) {
    return {
      status: "error",
      message: context.error ?? "Unable to validate the admin context.",
    };
  }

  if (!requestId) {
    return {
      status: "error",
      message: "The selected group update request is not valid.",
    };
  }

  const request = await prisma.groupRequest.findFirst({
    where: {
      id: requestId,
      editionId: context.activeEdition.id,
      requestType: "UPDATE_GROUP",
      status: "PENDING",
    },
    select: {
      id: true,
      group: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
    },
  });

  if (!request?.group) {
    return {
      status: "error",
      message: "The affected group is no longer available.",
    };
  }

  const affectedGroup = request.group;

  if (!affectedGroup.isActive) {
    return {
      status: "error",
      message:
        "The affected group is suspended. Reactivate it before editing this request.",
    };
  }

  const requestedGroupName =
    requestedGroupNameInput &&
    requestedGroupNameInput !== affectedGroup.name
      ? requestedGroupNameInput
      : null;

  const validationError = await validateUpdateGroupRequestData({
    editionId: context.activeEdition.id,
    groupId: affectedGroup.id,
    currentGroupName: affectedGroup.name,
    requestedGroupName,
    studentNumbersToAdd,
    studentNumbersToRemove,
  });

  if (validationError) {
    return {
      status: "error",
      message: validationError,
    };
  }

  await prisma.$transaction([
    prisma.groupRequest.update({
      where: {
        id: request.id,
      },
      data: {
        requestedGroupName,
        adminNote: adminNote || null,
      },
    }),
    prisma.groupRequestMember.deleteMany({
      where: {
        requestId: request.id,
      },
    }),
    prisma.groupRequestMember.createMany({
      data: [
        ...studentNumbersToAdd.map((studentNumber) => ({
          requestId: request.id,
          studentNumber,
          action: "ADD",
        })),
        ...studentNumbersToRemove.map((studentNumber) => ({
          requestId: request.id,
          studentNumber,
          action: "REMOVE",
        })),
      ],
    }),
  ]);

  revalidatePath("/area-gruppo");
  revalidatePath("/admin");
  revalidatePath("/admin/group-requests");
  revalidatePath(`/admin/group-requests/${request.id}`);

  return {
    status: "success",
    message: "Pending group update request updated successfully.",
  };
}

export async function approveGroupUpdateRequest(
  _previousState: AdminGroupRequestActionState,
  formData: FormData,
): Promise<AdminGroupRequestActionState> {
  const requestId = parsePositiveInteger(formData.get("requestId"));
  const context = await requireAdminContext();

  if (context.error || !context.activeEdition) {
    return {
      status: "error",
      message: context.error ?? "Unable to validate the admin context.",
    };
  }

  if (!requestId) {
    return {
      status: "error",
      message: "The selected group update request is not valid.",
    };
  }

  const request = await prisma.groupRequest.findFirst({
    where: {
      id: requestId,
      editionId: context.activeEdition.id,
      requestType: "UPDATE_GROUP",
      status: "PENDING",
    },
    select: {
      id: true,
      requestedGroupName: true,
      group: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
      members: {
        select: {
          studentNumber: true,
          action: true,
        },
      },
    },
  });

  if (!request?.group) {
    return {
      status: "error",
      message: "The affected group is no longer available.",
    };
  }

  const affectedGroup = request.group;

  if (!affectedGroup.isActive) {
    return {
      status: "error",
      message:
        "The affected group is suspended. Reactivate it before approving this request.",
    };
  }

  const studentNumbersToAdd = request.members
    .filter((member) => member.action === "ADD")
    .map((member) => member.studentNumber);

  const studentNumbersToRemove = request.members
    .filter((member) => member.action === "REMOVE")
    .map((member) => member.studentNumber);

  const requestedGroupName =
    request.requestedGroupName &&
    request.requestedGroupName !== affectedGroup.name
      ? request.requestedGroupName
      : null;

  const validationError = await validateUpdateGroupRequestData({
    editionId: context.activeEdition.id,
    groupId: affectedGroup.id,
    currentGroupName: affectedGroup.name,
    requestedGroupName,
    studentNumbersToAdd,
    studentNumbersToRemove,
  });

  if (validationError) {
    return {
      status: "error",
      message: `Approval blocked: ${validationError}`,
    };
  }

  const removedMemberIds =
    studentNumbersToRemove.length > 0
      ? await prisma.groupMember.findMany({
          where: {
            editionId: context.activeEdition.id,
            groupId: affectedGroup.id,
            isActive: true,
            studentNumber: {
              in: studentNumbersToRemove,
            },
          },
          select: {
            id: true,
          },
        })
      : [];

  await prisma.$transaction([
    ...(requestedGroupName
      ? [
          prisma.group.update({
            where: {
              id: affectedGroup.id,
            },
            data: {
              name: requestedGroupName,
              slug: slugify(requestedGroupName),
            },
          }),
        ]
      : []),
    ...(studentNumbersToAdd.length > 0
      ? [
          prisma.groupMember.createMany({
            data: studentNumbersToAdd.map((studentNumber) => ({
              editionId: context.activeEdition.id,
              groupId: affectedGroup.id,
              studentNumber,
              isActive: true,
            })),
          }),
        ]
      : []),
    ...(studentNumbersToRemove.length > 0
      ? [
          prisma.groupMember.updateMany({
            where: {
              editionId: context.activeEdition.id,
              groupId: affectedGroup.id,
              isActive: true,
              studentNumber: {
                in: studentNumbersToRemove,
              },
            },
            data: {
              isActive: false,
            },
          }),
          prisma.studentSession.deleteMany({
            where: {
              memberId: {
                in: removedMemberIds.map((member) => member.id),
              },
            },
          }),
        ]
      : []),
    prisma.groupRequest.update({
      where: {
        id: request.id,
      },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/area-gruppo");
  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${affectedGroup.id}`);
  revalidatePath("/admin/group-requests");
  revalidatePath(`/admin/group-requests/${request.id}`);
  revalidatePath("/catalogo");
  revalidatePath("/leaderboard");

  return {
    status: "success",
    message: `Group update approved. Added members: ${studentNumbersToAdd.length}. Deactivated members: ${studentNumbersToRemove.length}.`,
  };
}

export async function rejectGroupUpdateRequest(
  _previousState: AdminGroupRequestActionState,
  formData: FormData,
): Promise<AdminGroupRequestActionState> {
  const requestId = parsePositiveInteger(formData.get("requestId"));
  const adminNote = normalizeLongText(formData.get("adminNote"));
  const context = await requireAdminContext();

  if (context.error || !context.activeEdition) {
    return {
      status: "error",
      message: context.error ?? "Unable to validate the admin context.",
    };
  }

  if (!requestId) {
    return {
      status: "error",
      message: "The selected group update request is not valid.",
    };
  }

  const request = await prisma.groupRequest.findFirst({
    where: {
      id: requestId,
      editionId: context.activeEdition.id,
      requestType: "UPDATE_GROUP",
      status: "PENDING",
    },
    select: {
      id: true,
    },
  });

  if (!request) {
    return {
      status: "error",
      message:
        "Only pending group update requests from the active edition can be rejected.",
    };
  }

  await prisma.groupRequest.update({
    where: {
      id: request.id,
    },
    data: {
      status: "REJECTED",
      adminNote: adminNote || null,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/area-gruppo");
  revalidatePath("/admin");
  revalidatePath("/admin/group-requests");
  revalidatePath(`/admin/group-requests/${request.id}`);

  return {
    status: "success",
    message: "Group update request rejected successfully.",
  };
}

export async function clearReviewedCreateGroupRequestHistory(
  _previousState: AdminGroupRequestActionState,
  _formData: FormData,
): Promise<AdminGroupRequestActionState> {
  const context = await requireAdminContext();

  if (context.error || !context.activeEdition) {
    return {
      status: "error",
      message: context.error ?? "Unable to validate the admin context.",
    };
  }

  const reviewedRequests = await prisma.groupRequest.findMany({
    where: {
      editionId: context.activeEdition.id,
      status: {
        in: ["APPROVED", "REJECTED"],
      },
    },
    select: {
      id: true,
    },
  });

  if (reviewedRequests.length === 0) {
    return {
      status: "success",
      message: "There is no approval or rejection history to clear.",
    };
  }

  await prisma.groupRequest.deleteMany({
    where: {
      id: {
        in: reviewedRequests.map((request) => request.id),
      },
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/group-requests");

  return {
    status: "success",
    message: `Approval and rejection history cleared. Removed requests: ${reviewedRequests.length}.`,
  };
}
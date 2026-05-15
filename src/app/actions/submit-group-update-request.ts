'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentSession } from "@/lib/student-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

export type GroupUpdateRequestState = {
  status: "idle" | "success" | "error";
  message: string;
  values: {
    requestedGroupName: string;
    studentNumbersToAdd: string;
    studentNumbersToRemove: string[];
    note: string;
  };
};

type GroupContext = {
  groupId: number;
  groupName: string;
  activeMemberNumbers: string[];
};

function normalizeText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeLongText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function parseStudentNumbers(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[\n,;]+/)
        .map((studentNumber) => studentNumber.trim())
        .filter(Boolean),
    ),
  ];
}

function parseSelectedStudentNumbers(values: FormDataEntryValue[]): string[] {
  return [
    ...new Set(
      values
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    ),
  ];
}

function buildState(
  status: GroupUpdateRequestState["status"],
  message: string,
  values: GroupUpdateRequestState["values"],
): GroupUpdateRequestState {
  return {
    status,
    message,
    values,
  };
}

async function getGroupContext(): Promise<
  | {
      error: string;
      currentSession: null;
      activeEdition: null;
      group: null;
    }
  | {
      error: null;
      currentSession: Awaited<ReturnType<typeof getCurrentStudentSession>>;
      activeEdition: NonNullable<Awaited<ReturnType<typeof getActiveCourseEdition>>>;
      group: GroupContext;
    }
> {
  const [currentSession, activeEdition] = await Promise.all([
    getCurrentStudentSession(),
    getActiveCourseEdition(),
  ]);

  if (!currentSession) {
    return {
      error: "Your student session is no longer valid. Return to the homepage and sign in again.",
      currentSession: null,
      activeEdition: null,
      group: null,
    };
  }

  if (!activeEdition) {
    return {
      error: "No active course edition is currently configured.",
      currentSession: null,
      activeEdition: null,
      group: null,
    };
  }

  const group = await prisma.group.findFirst({
    where: {
      id: currentSession.member.groupId,
      editionId: activeEdition.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      members: {
        where: {
          isActive: true,
        },
        select: {
          studentNumber: true,
        },
        orderBy: {
          studentNumber: "asc",
        },
      },
    },
  });

  if (!group) {
    return {
      error: "Your group is not available in the active course edition.",
      currentSession: null,
      activeEdition: null,
      group: null,
    };
  }

  return {
    error: null,
    currentSession,
    activeEdition,
    group: {
      groupId: group.id,
      groupName: group.name,
      activeMemberNumbers: group.members.map((member) => member.studentNumber),
    },
  };
}

export async function submitGroupUpdateRequest(
  _previousState: GroupUpdateRequestState,
  formData: FormData,
): Promise<GroupUpdateRequestState> {
  const values = {
    requestedGroupName: normalizeText(formData.get("requestedGroupName")),
    studentNumbersToAdd: normalizeLongText(formData.get("studentNumbersToAdd")),
    studentNumbersToRemove: parseSelectedStudentNumbers(
      formData.getAll("studentNumbersToRemove"),
    ),
    note: normalizeLongText(formData.get("note")),
  };

  const context = await getGroupContext();

  if (context.error || !context.currentSession || !context.activeEdition || !context.group) {
    return buildState(
      "error",
      context.error ?? "Unable to validate the current group context.",
      values,
    );
  }

  const normalizedRequestedName = values.requestedGroupName;
  const requestedGroupName =
    normalizedRequestedName && normalizedRequestedName !== context.group.groupName
      ? normalizedRequestedName
      : null;

  const studentNumbersToAdd = parseStudentNumbers(values.studentNumbersToAdd);
  const studentNumbersToRemove = values.studentNumbersToRemove;

  const selectedMembersNotInGroup = studentNumbersToRemove.filter(
    (studentNumber) => !context.group.activeMemberNumbers.includes(studentNumber),
  );

  if (selectedMembersNotInGroup.length > 0) {
    return buildState(
      "error",
      `These student IDs are not active members of your group: ${selectedMembersNotInGroup.join(", ")}.`,
      values,
    );
  }

  const hasRenameRequest = Boolean(requestedGroupName);
  const hasAddRequest = studentNumbersToAdd.length > 0;
  const hasRemoveRequest = studentNumbersToRemove.length > 0;

  if (!hasRenameRequest && !hasAddRequest && !hasRemoveRequest) {
    return buildState(
      "error",
      "Request at least one real change: a different group name, a new student ID to add or an existing student ID to remove.",
      values,
    );
  }

  const projectedActiveMembers =
    context.group.activeMemberNumbers.length -
    studentNumbersToRemove.length +
    studentNumbersToAdd.length;

  if (projectedActiveMembers <= 0) {
    return buildState(
      "error",
      "The request would leave the group without active members. Keep at least one member or request new members at the same time.",
      values,
    );
  }

  const pendingRequest = await prisma.groupRequest.findFirst({
    where: {
      editionId: context.activeEdition.id,
      groupId: context.group.groupId,
      requestType: "UPDATE_GROUP",
      status: "PENDING",
    },
    select: {
      id: true,
    },
  });

  if (pendingRequest) {
    return buildState(
      "error",
      "Your group already has a pending update request. Wait for admin review before submitting another one.",
      values,
    );
  }

  if (requestedGroupName) {
    const conflictingGroup = await prisma.group.findFirst({
      where: {
        editionId: context.activeEdition.id,
        name: requestedGroupName,
        id: {
          not: context.group.groupId,
        },
      },
      select: {
        id: true,
      },
    });

    if (conflictingGroup) {
      return buildState(
        "error",
        "Another group in the active edition already uses the requested name.",
        values,
      );
    }
  }

  if (studentNumbersToAdd.length > 0) {
    const alreadyRegisteredMembers = await prisma.groupMember.findMany({
      where: {
        editionId: context.activeEdition.id,
        studentNumber: {
          in: studentNumbersToAdd,
        },
      },
      select: {
        studentNumber: true,
      },
    });

    if (alreadyRegisteredMembers.length > 0) {
      return buildState(
        "error",
        `These student IDs are already registered in the active edition: ${alreadyRegisteredMembers
          .map((member) => member.studentNumber)
          .join(", ")}.`,
        values,
      );
    }
  }

  await prisma.groupRequest.create({
    data: {
      editionId: context.activeEdition.id,
      groupId: context.group.groupId,
      requestedByMemberId: context.currentSession.member.id,
      requestType: "UPDATE_GROUP",
      requestedGroupName,
      note: values.note || null,
      status: "PENDING",
      members: {
        create: [
          ...studentNumbersToAdd.map((studentNumber) => ({
            studentNumber,
            action: "ADD",
          })),
          ...studentNumbersToRemove.map((studentNumber) => ({
            studentNumber,
            action: "REMOVE",
          })),
        ],
      },
    },
  });

  revalidatePath("/area-gruppo");
  revalidatePath("/admin");
  revalidatePath("/admin/group-requests");

  return buildState(
    "success",
    "Group update request submitted successfully. It is now waiting for admin review.",
    {
      requestedGroupName: context.group.groupName,
      studentNumbersToAdd: "",
      studentNumbersToRemove: [],
      note: "",
    },
  );
}

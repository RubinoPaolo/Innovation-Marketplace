'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActiveCourseEdition } from "@/lib/active-edition";

export type PublicGroupRequestState = {
  status: "idle" | "success" | "error";
  message: string;
  values: {
    groupName: string;
    studentNumbers: string;
    note: string;
  };
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

function buildState(
  status: PublicGroupRequestState["status"],
  message: string,
  values: PublicGroupRequestState["values"],
): PublicGroupRequestState {
  return {
    status,
    message,
    values,
  };
}

export async function submitPublicGroupRequest(
  _previousState: PublicGroupRequestState,
  formData: FormData,
): Promise<PublicGroupRequestState> {
  const values = {
    groupName: normalizeText(formData.get("groupName")),
    studentNumbers: normalizeLongText(formData.get("studentNumbers")),
    note: normalizeLongText(formData.get("note")),
  };

  const activeEdition = await getActiveCourseEdition();

  if (!activeEdition) {
    return buildState(
      "error",
      "No active course edition is currently configured. Contact the administrator.",
      values,
    );
  }

  if (!values.groupName) {
    return buildState("error", "Enter a proposed group name.", values);
  }

  const studentNumbers = parseStudentNumbers(values.studentNumbers);

  if (studentNumbers.length === 0) {
    return buildState("error", "Enter at least one student ID.", values);
  }

  const existingGroup = await prisma.group.findFirst({
    where: {
      editionId: activeEdition.id,
      name: values.groupName,
    },
    select: {
      id: true,
    },
  });

  if (existingGroup) {
    return buildState(
      "error",
      "A group with this name already exists in the active edition.",
      values,
    );
  }

  const existingMembers = await prisma.groupMember.findMany({
    where: {
      editionId: activeEdition.id,
      studentNumber: {
        in: studentNumbers,
      },
    },
    select: {
      studentNumber: true,
    },
  });

  if (existingMembers.length > 0) {
    return buildState(
      "error",
      `These student IDs are already registered in the active edition: ${existingMembers
        .map((member) => member.studentNumber)
        .join(", ")}.`,
      values,
    );
  }

  const duplicatePendingRequest = await prisma.groupRequest.findFirst({
    where: {
      editionId: activeEdition.id,
      requestType: "CREATE_GROUP",
      status: "PENDING",
      requestedGroupName: values.groupName,
    },
    select: {
      id: true,
    },
  });

  if (duplicatePendingRequest) {
    return buildState(
      "error",
      "A pending group creation request with this name already exists.",
      values,
    );
  }

  await prisma.groupRequest.create({
    data: {
      editionId: activeEdition.id,
      requestType: "CREATE_GROUP",
      requestedGroupName: values.groupName,
      note: values.note || null,
      status: "PENDING",
      members: {
        create: studentNumbers.map((studentNumber) => ({
          studentNumber,
          action: "ADD",
        })),
      },
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/group-requests");

  return buildState(
    "success",
    "Group request submitted successfully. It is now waiting for admin review.",
    {
      groupName: "",
      studentNumbers: "",
      note: "",
    },
  );
}

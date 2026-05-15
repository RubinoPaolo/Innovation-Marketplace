'use server';

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createStudentSession } from "@/lib/student-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

type StudentAccessState = {
  message: string;
};

function normalizeStudentNumber(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function normalizeGroupId(value: FormDataEntryValue | null): number | null {
  const parsed = Number(String(value ?? "").trim());

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function identifyStudent(
  _previousState: StudentAccessState,
  formData: FormData,
): Promise<StudentAccessState> {
  const activeEdition = await getActiveCourseEdition();

  if (!activeEdition) {
    return {
      message:
        "No active course edition is currently configured. Contact the administrator.",
    };
  }

  const groupId = normalizeGroupId(formData.get("groupId"));
  const studentNumber = normalizeStudentNumber(formData.get("studentNumber"));

  if (!groupId) {
    return {
      message: "Select your group before continuing.",
    };
  }

  if (!studentNumber) {
    return {
      message: "Enter your student ID before continuing.",
    };
  }

  const member = await prisma.groupMember.findFirst({
    where: {
      groupId,
      editionId: activeEdition.id,
      studentNumber,
      isActive: true,
      group: {
        isActive: true,
      },
    },
    include: {
      group: true,
    },
  });

  if (!member) {
    return {
      message:
        "The selected group and student ID do not match an active record in the current course edition. Check the data and try again.",
    };
  }

  await createStudentSession(member.id);
  redirect("/");
}
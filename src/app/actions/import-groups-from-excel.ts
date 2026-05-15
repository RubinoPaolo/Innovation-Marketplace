'use server';

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/admin-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

export type ImportGroupsFromExcelState = {
  status: "idle" | "success" | "error";
  message: string;
};

type ParsedGroup = {
  name: string;
  slug: string;
  studentNumbers: string[];
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeHeader(value: unknown): string {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeStudentNumber(value: unknown): string {
  return normalizeText(value).replace(/\s+/g, "");
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

export async function importGroupsFromExcel(
  _previousState: ImportGroupsFromExcelState,
  formData: FormData,
): Promise<ImportGroupsFromExcelState> {
  const context = await requireAdminContext();

  if (context.error || !context.activeEdition) {
    return {
      status: "error",
      message: context.error ?? "Unable to validate the admin context.",
    };
  }

  const uploadedFile = formData.get("excelFile");

  if (!(uploadedFile instanceof File)) {
    return {
      status: "error",
      message: "Upload a valid Excel file.",
    };
  }

  if (uploadedFile.size === 0) {
    return {
      status: "error",
      message: "The uploaded Excel file is empty.",
    };
  }

  const fileName = uploadedFile.name.toLowerCase();

  if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
    return {
      status: "error",
      message: "Only .xlsx and .xls files are supported.",
    };
  }

  let workbook: XLSX.WorkBook;

  try {
    const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());

    workbook = XLSX.read(fileBuffer, {
      type: "buffer",
    });
  } catch {
    return {
      status: "error",
      message:
        "Unable to read the Excel file. Check that the file is not corrupted.",
    };
  }

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return {
      status: "error",
      message: "The Excel workbook does not contain any worksheet.",
    };
  }

  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet) {
    return {
      status: "error",
      message: "Unable to read the first worksheet in the Excel file.",
    };
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (rows.length < 2) {
    return {
      status: "error",
      message:
        "The worksheet must contain a header row and at least one data row.",
    };
  }

  const headerRow = rows[0] ?? [];
  const normalizedHeaders = headerRow.map((cell) => normalizeHeader(cell));

  const groupNameColumnIndex = normalizedHeaders.findIndex((header) =>
    [
      "group name",
      "group",
      "nome gruppo",
      "gruppo",
    ].includes(header),
  );

  const studentNumberColumnIndex = normalizedHeaders.findIndex((header) =>
    [
      "student ids",
      "student id",
      "student numbers",
      "student number",
      "matricole componenti",
      "matricola",
      "matricole",
    ].includes(header),
  );

  if (groupNameColumnIndex === -1 || studentNumberColumnIndex === -1) {
    return {
      status: "error",
      message:
        'The Excel file must contain columns named "Group Name" and "Student IDs".',
    };
  }

  const groupsMap = new Map<string, Set<string>>();
  const studentAssignments = new Map<string, string>();
  const parsingErrors: string[] = [];

  let currentGroupName = "";

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] ?? [];
    const excelRowNumber = rowIndex + 1;

    const rawGroupName = normalizeText(row[groupNameColumnIndex]);
    const studentNumber = normalizeStudentNumber(
      row[studentNumberColumnIndex],
    );

    if (rawGroupName) {
      currentGroupName = rawGroupName;
    }

    if (!rawGroupName && !studentNumber) {
      continue;
    }

    if (!currentGroupName) {
      parsingErrors.push(
        `Row ${excelRowNumber}: a student ID is present without a group name above it.`,
      );
      continue;
    }

    if (!studentNumber) {
      continue;
    }

    const existingAssignedGroup = studentAssignments.get(studentNumber);

    if (
      existingAssignedGroup &&
      existingAssignedGroup !== currentGroupName
    ) {
      parsingErrors.push(
        `Student ID ${studentNumber} appears in more than one group: ${existingAssignedGroup} and ${currentGroupName}.`,
      );
      continue;
    }

    studentAssignments.set(studentNumber, currentGroupName);

    if (!groupsMap.has(currentGroupName)) {
      groupsMap.set(currentGroupName, new Set<string>());
    }

    groupsMap.get(currentGroupName)?.add(studentNumber);
  }

  if (parsingErrors.length > 0) {
    return {
      status: "error",
      message: parsingErrors.slice(0, 4).join(" "),
    };
  }

  if (groupsMap.size === 0) {
    return {
      status: "error",
      message: "No valid groups were found in the Excel file.",
    };
  }

  const parsedGroups: ParsedGroup[] = Array.from(groupsMap.entries()).map(
    ([name, studentNumbersSet]) => ({
      name,
      slug: slugify(name),
      studentNumbers: Array.from(studentNumbersSet),
    }),
  );

  const groupsWithoutSlug = parsedGroups.filter((group) => !group.slug);

  if (groupsWithoutSlug.length > 0) {
    return {
      status: "error",
      message: `These group names are not valid: ${groupsWithoutSlug
        .map((group) => group.name)
        .join(", ")}.`,
    };
  }

  const groupsWithoutMembers = parsedGroups.filter(
    (group) => group.studentNumbers.length === 0,
  );

  if (groupsWithoutMembers.length > 0) {
    return {
      status: "error",
      message: `These groups do not contain any student ID: ${groupsWithoutMembers
        .map((group) => group.name)
        .join(", ")}.`,
    };
  }

  const duplicatedSlugs = parsedGroups
    .map((group) => group.slug)
    .filter((slug, index, allSlugs) => allSlugs.indexOf(slug) !== index);

  if (duplicatedSlugs.length > 0) {
    return {
      status: "error",
      message:
        "Two or more imported group names generate the same internal identifier. Rename them slightly and try again.",
    };
  }

  const allImportedStudentNumbers = parsedGroups.flatMap(
    (group) => group.studentNumbers,
  );

  const [
    existingGroupsByName,
    existingGroupsBySlug,
    existingMembers,
  ] = await Promise.all([
    prisma.group.findMany({
      where: {
        editionId: context.activeEdition.id,
        name: {
          in: parsedGroups.map((group) => group.name),
        },
      },
      select: {
        name: true,
      },
    }),
    prisma.group.findMany({
      where: {
        editionId: context.activeEdition.id,
        slug: {
          in: parsedGroups.map((group) => group.slug),
        },
      },
      select: {
        name: true,
        slug: true,
      },
    }),
    prisma.groupMember.findMany({
      where: {
        editionId: context.activeEdition.id,
        studentNumber: {
          in: allImportedStudentNumbers,
        },
      },
      select: {
        studentNumber: true,
      },
    }),
  ]);

  if (existingGroupsByName.length > 0) {
    return {
      status: "error",
      message: `These group names already exist in the active edition: ${existingGroupsByName
        .map((group) => group.name)
        .join(", ")}.`,
    };
  }

  if (existingGroupsBySlug.length > 0) {
    return {
      status: "error",
      message: `Some imported group names conflict with existing internal identifiers: ${existingGroupsBySlug
        .map((group) => group.name)
        .join(", ")}.`,
    };
  }

  if (existingMembers.length > 0) {
    return {
      status: "error",
      message: `These student IDs are already registered in the active edition: ${existingMembers
        .map((member) => member.studentNumber)
        .join(", ")}.`,
    };
  }

  await prisma.$transaction(
    parsedGroups.map((group) =>
      prisma.group.create({
        data: {
          editionId: context.activeEdition.id,
          name: group.name,
          slug: group.slug,
          isActive: true,
          members: {
            create: group.studentNumbers.map((studentNumber) => ({
              editionId: context.activeEdition.id,
              studentNumber,
              isActive: true,
            })),
          },
        },
      }),
    ),
  );

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/groups");

  return {
    status: "success",
    message: `Excel import completed. Created groups: ${parsedGroups.length}. Imported student IDs: ${allImportedStudentNumbers.length}.`,
  };
}
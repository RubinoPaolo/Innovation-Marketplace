import "dotenv/config";
import * as fs from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { readFile, set_fs, utils } from "xlsx";

set_fs(fs);

const DATABASE_URL = process.env.DATABASE_URL ?? "file:./dev.db";
const EXCEL_PATH = path.resolve(
  process.cwd(),
  "data/source/Database_Gruppi_Innovation_Management.xlsx",
);

const CURRENT_EDITION_NAME = "Innovation Management 2026";
const CURRENT_ACADEMIC_YEAR = "2026";

const adapter = new PrismaBetterSqlite3({ url: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type RawCell = string | number | boolean | null | undefined;

type GroupSeed = {
  name: string;
  slug: string;
  members: string[];
};

const DEFAULT_CATEGORIES = [
  "Sustainability",
  "Technology",
  "Education",
  "Health & Wellbeing",
  "Mobility",
  "Lifestyle",
  "Productivity",
];

const DEFAULT_BADGES = [
  "Eco-friendly",
  "Low cost",
  "AI-based",
  "Made for students",
  "Social impact",
  "Prototype ready",
];

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function slugify(value: string): string {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeStudentNumber(value: RawCell): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }

    return String(Math.trunc(value));
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return null;
  }

  return normalized.replace(/\.0+$/, "");
}

function parseGroupsFromExcel(filePath: string): GroupSeed[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Excel file not found at: ${filePath}. Copy it there before running the seed.`,
    );
  }

  const workbook = readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("The Excel file does not contain a readable sheet.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = utils.sheet_to_json<RawCell[]>(worksheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  const dataRows = rows.slice(1);
  const groups: GroupSeed[] = [];
  let currentGroup: GroupSeed | null = null;

  for (const row of dataRows) {
    const rawGroupName = row[0];
    const rawStudentNumber = row[1];

    const groupName =
      typeof rawGroupName === "string" && rawGroupName.trim()
        ? normalizeText(rawGroupName)
        : null;

    const studentNumber = normalizeStudentNumber(rawStudentNumber);

    if (groupName) {
      currentGroup = {
        name: groupName,
        slug: slugify(groupName),
        members: [],
      };
      groups.push(currentGroup);
    }

    if (!currentGroup) {
      continue;
    }

    if (studentNumber && !currentGroup.members.includes(studentNumber)) {
      currentGroup.members.push(studentNumber);
    }
  }

  return groups;
}

async function ensureCurrentEdition() {
  const edition = await prisma.courseEdition.upsert({
    where: {
      academicYear: CURRENT_ACADEMIC_YEAR,
    },
    update: {
      name: CURRENT_EDITION_NAME,
      isActive: true,
    },
    create: {
      name: CURRENT_EDITION_NAME,
      academicYear: CURRENT_ACADEMIC_YEAR,
      isActive: true,
    },
  });

  await prisma.courseEdition.updateMany({
    where: {
      id: {
        not: edition.id,
      },
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  return edition;
}

async function seedReferenceData(): Promise<void> {
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: category },
      update: {
        slug: slugify(category),
      },
      create: {
        name: category,
        slug: slugify(category),
      },
    });
  }

  for (const badge of DEFAULT_BADGES) {
    await prisma.badge.upsert({
      where: { name: badge },
      update: {
        slug: slugify(badge),
      },
      create: {
        name: badge,
        slug: slugify(badge),
      },
    });
  }
}

async function seedGroupsAndMembers(
  editionId: number,
  groups: GroupSeed[],
): Promise<void> {
  for (const group of groups) {
    const dbGroup = await prisma.group.upsert({
      where: {
        editionId_name: {
          editionId,
          name: group.name,
        },
      },
      update: {
        slug: group.slug,
      },
      create: {
        editionId,
        name: group.name,
        slug: group.slug,
      },
    });

    for (const studentNumber of group.members) {
      await prisma.groupMember.upsert({
        where: {
          editionId_studentNumber: {
            editionId,
            studentNumber,
          },
        },
        update: {
          groupId: dbGroup.id,
          isActive: true,
        },
        create: {
          editionId,
          groupId: dbGroup.id,
          studentNumber,
          isActive: true,
        },
      });
    }
  }
}

async function seedVotingSettings(editionId: number): Promise<void> {
  await prisma.votingSettings.upsert({
    where: {
      editionId,
    },
    update: {},
    create: {
      editionId,
      isOpen: false,
    },
  });
}

async function printSeedSummary(editionId: number): Promise<void> {
  const [
    edition,
    groupsCount,
    membersCount,
    activeMembersCount,
    categoriesCount,
    badgesCount,
    votingSettings,
  ] = await Promise.all([
    prisma.courseEdition.findUnique({
      where: {
        id: editionId,
      },
      select: {
        name: true,
        academicYear: true,
        isActive: true,
      },
    }),
    prisma.group.count({
      where: {
        editionId,
      },
    }),
    prisma.groupMember.count({
      where: {
        editionId,
      },
    }),
    prisma.groupMember.count({
      where: {
        editionId,
        isActive: true,
      },
    }),
    prisma.category.count(),
    prisma.badge.count(),
    prisma.votingSettings.findUnique({
      where: {
        editionId,
      },
      select: {
        isOpen: true,
      },
    }),
  ]);

  console.log("\nSeed completed successfully.");
  console.log(`Edition: ${edition?.name ?? "Unknown"}`);
  console.log(`Academic year: ${edition?.academicYear ?? "Unknown"}`);
  console.log(`Edition active: ${edition?.isActive ? "YES" : "NO"}`);
  console.log(`Groups stored for this edition: ${groupsCount}`);
  console.log(`Student IDs stored for this edition: ${membersCount}`);
  console.log(`Active student IDs for this edition: ${activeMembersCount}`);
  console.log(`Categories stored: ${categoriesCount}`);
  console.log(`Badges stored: ${badgesCount}`);
  console.log(
    `Voting status: ${votingSettings?.isOpen ? "OPEN" : "CLOSED"}`,
  );
}

async function main(): Promise<void> {
  const groups = parseGroupsFromExcel(EXCEL_PATH);
  const edition = await ensureCurrentEdition();

  if (groups.length === 0) {
    throw new Error("No groups were found in the Excel file.");
  }

  await seedReferenceData();
  await seedGroupsAndMembers(edition.id, groups);
  await seedVotingSettings(edition.id);
  await printSeedSummary(edition.id);
}

main()
  .catch((error) => {
    console.error("Error while seeding the database:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
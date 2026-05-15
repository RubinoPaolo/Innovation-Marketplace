import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const DATABASE_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DIRECT_URL or DATABASE_URL is not defined.");
}

const CURRENT_EDITION_NAME = "Innovation Management 2026";
const CURRENT_ACADEMIC_YEAR = "2026";

const adapter = new PrismaNeon({
  connectionString: DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function ensureCurrentEdition() {
  const existingEdition = await prisma.courseEdition.findFirst({
    where: {
      name: CURRENT_EDITION_NAME,
      academicYear: CURRENT_ACADEMIC_YEAR,
    },
  });

  const edition = existingEdition
    ? await prisma.courseEdition.update({
        where: {
          id: existingEdition.id,
        },
        data: {
          isActive: true,
        },
      })
    : await prisma.courseEdition.create({
        data: {
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

async function attachExistingDataToEdition(editionId: number) {
  const [groupsUpdate, membersUpdate, votingSettingsUpdate] =
    await Promise.all([
      prisma.group.updateMany({
        where: {
          editionId: null,
        },
        data: {
          editionId,
        },
      }),
      prisma.groupMember.updateMany({
        where: {
          editionId: null,
        },
        data: {
          editionId,
          isActive: true,
        },
      }),
      prisma.votingSettings.updateMany({
        where: {
          editionId: null,
        },
        data: {
          editionId,
        },
      }),
    ]);

  const existingEditionVotingSettings =
    await prisma.votingSettings.findUnique({
      where: {
        editionId,
      },
      select: {
        id: true,
      },
    });

  if (!existingEditionVotingSettings) {
    await prisma.votingSettings.create({
      data: {
        editionId,
        isOpen: false,
      },
    });
  }

  return {
    updatedGroups: groupsUpdate.count,
    updatedMembers: membersUpdate.count,
    updatedVotingSettings: votingSettingsUpdate.count,
  };
}

async function printSummary(
  editionId: number,
  migrationCounts: {
    updatedGroups: number;
    updatedMembers: number;
    updatedVotingSettings: number;
  },
) {
  const [
    edition,
    groupsCount,
    membersCount,
    activeMembersCount,
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
    prisma.votingSettings.findUnique({
      where: {
        editionId,
      },
      select: {
        isOpen: true,
      },
    }),
  ]);

  console.log("\nCourse edition backfill completed successfully.");
  console.log(`Edition: ${edition?.name ?? "Unknown"}`);
  console.log(`Academic year: ${edition?.academicYear ?? "Unknown"}`);
  console.log(`Edition active: ${edition?.isActive ? "YES" : "NO"}`);
  console.log(`Groups moved during this run: ${migrationCounts.updatedGroups}`);
  console.log(`Members moved during this run: ${migrationCounts.updatedMembers}`);
  console.log(
    `Voting settings moved during this run: ${migrationCounts.updatedVotingSettings}`,
  );
  console.log(`Groups linked to the edition: ${groupsCount}`);
  console.log(`Members linked to the edition: ${membersCount}`);
  console.log(`Active members in the edition: ${activeMembersCount}`);
  console.log(
    `Voting status for the edition: ${votingSettings?.isOpen ? "OPEN" : "CLOSED"}`,
  );
}

async function main() {
  const edition = await ensureCurrentEdition();
  const migrationCounts = await attachExistingDataToEdition(edition.id);
  await printSummary(edition.id, migrationCounts);
}

main()
  .catch((error) => {
    console.error("Course edition backfill failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
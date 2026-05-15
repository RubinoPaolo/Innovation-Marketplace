import { prisma } from "@/lib/prisma";

export async function getActiveCourseEdition() {
  return prisma.courseEdition.findFirst({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      academicYear: true,
      isActive: true,
    },
  });
}

export async function requireActiveCourseEdition() {
  const activeEdition = await getActiveCourseEdition();

  if (!activeEdition) {
    throw new Error("No active course edition is currently configured.");
  }

  return activeEdition;
}

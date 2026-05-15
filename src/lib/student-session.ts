import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const STUDENT_SESSION_COOKIE = "innovation_student_session";
const SESSION_DURATION_HOURS = 12;
const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_HOURS * 60 * 60;

type StudentSessionWithMember = Awaited<
  ReturnType<typeof findStudentSessionByToken>
>;

function createToken(): string {
  return randomBytes(32).toString("hex");
}

async function findStudentSessionByToken(token: string) {
  return prisma.studentSession.findUnique({
    where: { token },
    include: {
      member: {
        include: {
          group: true,
          edition: true,
        },
      },
    },
  });
}

export async function createStudentSession(memberId: number): Promise<void> {
  const token = createToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.studentSession.create({
    data: {
      memberId,
      token,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(STUDENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function getCurrentStudentSession(): Promise<StudentSessionWithMember> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await findStudentSessionByToken(token);

  if (!session) {
    return null;
  }

  const sessionExpired = session.expiresAt <= new Date();
  const memberInactive = !session.member.isActive;
  const groupInactive = !session.member.group.isActive;
  const editionInactive = !session.member.edition?.isActive;
  const editionMismatch =
    session.member.group.editionId !== session.member.editionId;

  if (
    sessionExpired ||
    memberInactive ||
    groupInactive ||
    editionInactive ||
    editionMismatch
  ) {
    await prisma.studentSession.delete({
      where: { id: session.id },
    });

    return null;
  }

  return session;
}

export async function deleteCurrentStudentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value;

  if (token) {
    await prisma.studentSession.deleteMany({
      where: { token },
    });
  }

  cookieStore.delete(STUDENT_SESSION_COOKIE);
}
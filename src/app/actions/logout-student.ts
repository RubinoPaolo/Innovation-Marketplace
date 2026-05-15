'use server';

import { redirect } from "next/navigation";
import { deleteCurrentStudentSession } from "@/lib/student-session";

export async function logoutStudent(): Promise<void> {
  await deleteCurrentStudentSession();
  redirect("/");
}

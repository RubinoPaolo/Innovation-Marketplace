'use server';

import { redirect } from "next/navigation";
import {
  createAdminSession,
  deleteCurrentAdminSession,
} from "@/lib/admin-session";

export type AdminLoginState = {
  status: "idle" | "error";
  message: string;
};

function normalizePassword(value: FormDataEntryValue | null): string {
  return String(value ?? "");
}

export async function loginAdmin(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const submittedPassword = normalizePassword(formData.get("password"));

  if (!configuredPassword) {
    return {
      status: "error",
      message: "Admin access is not configured. Add ADMIN_PASSWORD to the .env file.",
    };
  }

  if (!submittedPassword) {
    return {
      status: "error",
      message: "Enter the admin password.",
    };
  }

  if (submittedPassword !== configuredPassword) {
    return {
      status: "error",
      message: "Incorrect admin password.",
    };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logoutAdmin(): Promise<void> {
  await deleteCurrentAdminSession();
  redirect("/admin");
}

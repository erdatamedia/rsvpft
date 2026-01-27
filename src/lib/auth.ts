import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export type SessionUser = {
  id: string;
  email: string;
};

const SESSION_COOKIE = "panitia_session";

export async function getUserFromSession(): Promise<SessionUser | null> {
  const cookieStore = await Promise.resolve(cookies());
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  const rows = await query<SessionUser>(
    "select id, email from admins where id=$1 limit 1",
    [session],
  );
  return rows[0] ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}

export async function signInPanitia(email: string, password: string) {
  const rows = await query<{ id: string; email: string; password_hash: string }>(
    "select id, email, password_hash from admins where email=$1 limit 1",
    [email],
  );
  const admin = rows[0];
  if (!admin) {
    throw new Error("Akun tidak ditemukan");
  }
  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    throw new Error("Kata sandi salah");
  }
  const cookieStore = await Promise.resolve(cookies());
  cookieStore.set(SESSION_COOKIE, admin.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function signOutPanitia() {
  const cookieStore = await Promise.resolve(cookies());
  cookieStore.delete(SESSION_COOKIE);
}

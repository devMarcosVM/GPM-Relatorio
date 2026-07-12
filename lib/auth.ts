import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import type { Role } from "./types";

const COOKIE_NAME = "relatorio-session";

function useSecureCookies() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (appUrl.startsWith("https://")) return true;
  if (appUrl.startsWith("http://")) return false;
  return process.env.NODE_ENV === "production";
}

export interface SessionUser {
  id: string;
  email: string;
  nome: string;
  role: Role;
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurado");
  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    nome: user.nome,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: useSecureCookies(),
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await joseVerify(token);
    return {
      id: payload.id as string,
      email: payload.email as string,
      nome: payload.nome as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

async function joseVerify(token: string) {
  return jwtVerify(token, getSecret());
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== "ADMIN") throw new Error("Acesso negado");
  return session;
}

export async function getUserFromDb(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import type { Role } from "./types";

const COOKIE_NAME = "relatorio-session";

const SESSION_MAX_AGE_TECNICO = 60 * 60 * 8; // 8 horas
const SESSION_MAX_AGE_ADMIN = 60 * 60 * 24 * 7; // 7 dias

export function getSessionMaxAgeSeconds(role: Role): number {
  return role === "ADMIN" ? SESSION_MAX_AGE_ADMIN : SESSION_MAX_AGE_TECNICO;
}

export function getSessionExpiration(role: Role): string {
  return role === "ADMIN" ? "7d" : "8h";
}

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

interface SessionPayload {
  id: string;
  email: string;
  nome: string;
  role: Role;
  sessionVersion: number;
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurado");
  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser & { sessionVersion: number }): Promise<void> {
  const role = user.role;
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    nome: user.nome,
    role,
    sessionVersion: user.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(getSessionExpiration(role))
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: useSecureCookies(),
    sameSite: "lax",
    maxAge: getSessionMaxAgeSeconds(role),
    path: "/",
  });
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sessionPayload = payload as unknown as SessionPayload;

    const user = await prisma.user.findUnique({
      where: { id: sessionPayload.id },
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        sessionVersion: true,
      },
    });

    if (!user) return null;
    if (user.sessionVersion !== sessionPayload.sessionVersion) return null;

    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role as Role,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
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

export async function invalidateUserSessions(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
}

export async function getUserFromDb(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export { COOKIE_NAME };

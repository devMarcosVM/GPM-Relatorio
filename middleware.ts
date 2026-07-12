import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "relatorio-session";

const publicPaths = ["/login", "/manifest.json", "/sw.js", "/icon.svg"];

function getSecret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "dev-secret-change-in-production"
  );
}

async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // PWA desativado em desenvolvimento — evita loop de recarregamento
  if (
    process.env.NODE_ENV === "development" &&
    (pathname === "/sw.js" || pathname === "/manifest.json")
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const isPublic =
    publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/_next/");

  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Usuário logado não precisa ficar na tela de login
  if (pathname.startsWith("/login") && token) {
    try {
      await verifyToken(token);
      return NextResponse.redirect(new URL("/", request.url));
    } catch {
      const response = NextResponse.next();
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  if (isPublic) {
    return NextResponse.next();
  }

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const payload = await verifyToken(token);
    const role = payload.role as string;

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/campo", request.url));
    }

    return NextResponse.next();
  } catch {
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Sessão inválida" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));

    // Remove cookie inválido para evitar loop de redirect
    if (!pathname.startsWith("/api/")) {
      response.cookies.delete(COOKIE_NAME);
    }

    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

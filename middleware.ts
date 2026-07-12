import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE_NAME } from "@/lib/auth";

const publicPaths = ["/login", "/manifest.json", "/sw.js", "/icon.svg", "/assinar"];

function getSecret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "dev-secret-change-in-production"
  );
}

async function verifyTokenSignature(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}

async function isSessionActive(request: NextRequest): Promise<boolean> {
  const validateUrl = new URL("/api/auth/validate-session", request.url);
  const res = await fetch(validateUrl, {
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
    cache: "no-store",
  });
  return res.ok;
}

function redirectToLogin(request: NextRequest, deleteCookie = false) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  if (deleteCookie) {
    response.cookies.delete(COOKIE_NAME);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    process.env.NODE_ENV === "development" &&
    (pathname === "/sw.js" || pathname === "/manifest.json")
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const isPublic =
    publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/validate-session") ||
    pathname.startsWith("/api/assinar/") ||
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/api/media/") ||
    pathname.startsWith("/_next/");

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isApi = pathname.startsWith("/api/");

  if (pathname.startsWith("/login") && token) {
    try {
      await verifyTokenSignature(token);
      if (await isSessionActive(request)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      // segue para a tela de login
    }
    const response = NextResponse.next();
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  if (isPublic) {
    return NextResponse.next();
  }

  if (!token) {
    if (isApi) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return redirectToLogin(request);
  }

  try {
    const payload = await verifyTokenSignature(token);

    if (!isApi) {
      const active = await isSessionActive(request);
      if (!active) {
        return redirectToLogin(request, true);
      }
    }

    const role = payload.role as string;

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/campo", request.url));
    }

    return NextResponse.next();
  } catch {
    if (isApi) {
      const response = NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
      return response;
    }
    return redirectToLogin(request, true);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

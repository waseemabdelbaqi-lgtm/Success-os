import { NextResponse, type NextRequest } from "next/server";
import { shouldBypassAuthMiddleware } from "@/lib/auth/routes";
import { evaluateMiddleware } from "@/lib/auth/middleware-engine";
import {
  verifySessionMeta,
  SESSION_META_COOKIE_NAME,
} from "@/lib/auth/session-meta";
import type { MiddlewareAuthContext } from "@/lib/auth/middleware-types";
import { COOKIE_NAMES } from "@/lib/constants";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

function getSessionCookie(request: NextRequest): string | undefined {
  const cookieName =
    process.env.AUTH_SESSION_COOKIE_NAME ?? COOKIE_NAMES.session;
  return request.cookies.get(cookieName)?.value;
}

function getSessionMetaCookie(request: NextRequest): string | undefined {
  return request.cookies.get(SESSION_META_COOKIE_NAME)?.value;
}

function isAuthFeatureEnabled(): boolean {
  return process.env.FEATURE_AUTH_ENABLED === "true";
}

async function buildAuthContext(
  request: NextRequest,
): Promise<MiddlewareAuthContext> {
  const sessionCookie = getSessionCookie(request);
  const sessionMetaCookie = getSessionMetaCookie(request);
  const metaSecret = process.env.AUTH_SESSION_META_SECRET;

  if (!sessionCookie) {
    return { isAuthenticated: false };
  }

  if (sessionMetaCookie && metaSecret) {
    const meta = await verifySessionMeta(sessionMetaCookie, metaSecret);

    if (meta) {
      return {
        isAuthenticated: true,
        uid: meta.uid,
        role: meta.role,
        permissions: meta.permissions,
        status: meta.status,
      };
    }
  }

  return { isAuthenticated: true };
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (shouldBypassAuthMiddleware(pathname)) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-url", request.url);

  if (!isAuthFeatureEnabled()) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const authContext = await buildAuthContext(request);

  if (authContext.isAuthenticated) {
    requestHeaders.set("x-auth-session", "present");
    if (authContext.role) {
      requestHeaders.set("x-user-role", authContext.role);
    }
    if (authContext.uid) {
      requestHeaders.set("x-user-id", authContext.uid);
    }
  }

  const decision = evaluateMiddleware(
    pathname,
    authContext,
    "/login",
  );

  if (decision.action === "redirect") {
    return NextResponse.redirect(new URL(decision.url, request.url));
  }

  if (decision.action === "deny") {
    return new NextResponse("Forbidden", { status: decision.status });
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

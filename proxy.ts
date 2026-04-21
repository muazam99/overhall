import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_MESSAGE_COOKIE, AUTH_PROMPT_COOKIE, AUTH_PROMPT_LOGIN } from "@/lib/auth-ui";

type SessionLike = {
  user?: {
    id?: string;
    role?: string | null;
  };
};

async function getSessionFromAuthApi(request: NextRequest): Promise<SessionLike | null> {
  const sessionUrl = new URL("/api/auth/get-session", request.url);
  const response = await fetch(sessionUrl, {
    method: "GET",
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
    cache: "no-store",
  }).catch(() => null);

  if (!response || !response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as SessionLike | null;
  if (!payload || !payload.user?.id) {
    return null;
  }

  return payload;
}

function buildAuthRedirect(request: NextRequest, options: { promptLogin: boolean; message: string }) {
  const response = NextResponse.redirect(new URL("/", request.url));

  response.cookies.set({
    name: AUTH_MESSAGE_COOKIE,
    value: options.message,
    maxAge: 120,
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  });

  if (options.promptLogin) {
    response.cookies.set({
      name: AUTH_PROMPT_COOKIE,
      value: AUTH_PROMPT_LOGIN,
      maxAge: 120,
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });
  } else {
    response.cookies.delete(AUTH_PROMPT_COOKIE);
  }

  return response;
}

export async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const session = await getSessionFromAuthApi(request);
  if (!session?.user?.id) {
    return buildAuthRedirect(request, {
      promptLogin: true,
      message: "Please log in to continue.",
    });
  }

  if (session.user.role !== "admin") {
    return buildAuthRedirect(request, {
      promptLogin: false,
      message: "You do not have permission to access the admin area.",
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

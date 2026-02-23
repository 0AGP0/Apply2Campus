import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const API_AUTH_PATHS = [
  "/api/admin",
  "/api/consultants",
  "/api/tasks",
  "/api/me",
];

function isApiAuthPath(pathname: string): boolean {
  return API_AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default withAuth(
  async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    if (isApiAuthPath(pathname)) {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === "production",
      });
      if (!token) {
        return NextResponse.json({ error: "Oturum bulunamadı. Lütfen tekrar giriş yapın." }, { status: 401 });
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = (req as NextRequest).nextUrl.pathname;
        if (isApiAuthPath(pathname)) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/students/:path*",
    "/operasyon/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/api/badges",
    "/api/students/:path*",
    "/api/students/:studentId/emails/:path*",
    "/api/students/:studentId/send",
    "/api/students/:studentId/disconnect",
    "/api/students/:studentId/sync",
    "/api/operasyon/:path*",
    "/api/oauth/gmail/start",
    "/api/admin/:path*",
    "/api/consultants/:path*",
    "/api/tasks",
    "/api/tasks/:path*",
    "/api/me/:path*",
  ],
};

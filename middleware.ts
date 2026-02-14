import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    "/students/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/api/badges",
    "/api/students/:path*",
    "/api/students/:studentId/emails/:path*",
    "/api/students/:studentId/send",
    "/api/students/:studentId/disconnect",
    "/api/students/:studentId/sync",
    "/api/oauth/gmail/start",
  ],
};

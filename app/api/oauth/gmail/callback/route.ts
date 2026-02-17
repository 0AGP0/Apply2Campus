import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client } from "@/lib/gmail";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { verifyOAuthState } from "@/lib/oauth-state";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state"); // studentId
  const error = req.nextUrl.searchParams.get("error");
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_denied`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/students?error=missing_params`);
  }

  const studentId = verifyOAuthState(state);
  if (!studentId) {
    return NextResponse.redirect(`${baseUrl}/students?error=invalid_state`);
  }
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    return NextResponse.redirect(`${baseUrl}/students?error=student_not_found`);
  }

  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    return NextResponse.redirect(
      `${baseUrl}/students/${studentId}?error=no_refresh_token`
    );
  }

  const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000);
  await prisma.gmailConnection.upsert({
    where: { studentId },
    create: {
      studentId,
      accessTokenEncrypted: tokens.access_token ? encrypt(tokens.access_token) : null,
      refreshTokenEncrypted: encrypt(tokens.refresh_token),
      expiryDate: expiry,
      status: "connected",
      scopes: tokens.scope ?? null,
    },
    update: {
      accessTokenEncrypted: tokens.access_token ? encrypt(tokens.access_token) : null,
      refreshTokenEncrypted: encrypt(tokens.refresh_token),
      expiryDate: expiry,
      status: "connected",
      scopes: tokens.scope ?? null,
    },
  });

  // Öğrenci kendi Gmail'ini bağladıysa dashboard'a, danışman öğrenci sayfasına yönlendir
  const studentUser = await prisma.user.findFirst({
    where: { studentId, role: "STUDENT" },
  });
  if (studentUser) {
    return NextResponse.redirect(`${baseUrl}/dashboard?gmail=connected`);
  }
  return NextResponse.redirect(`${baseUrl}/students/${studentId}?gmail=connected`);
}

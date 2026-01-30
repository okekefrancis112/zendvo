import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { validatePassword, sanitizeInput } from "@/lib/validation";
import { sendPasswordResetConfirmationEmail } from "@/server/services/emailService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and password are required" },
        { status: 400 },
      );
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      return NextResponse.json(
        { success: false, error: "Invalid token format" },
        { status: 400 },
      );
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        {
          success: false,
          error: "Password too weak",
          details: {
            message:
              "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
          },
        },
        { status: 400 },
      );
    }

    const resetRequest = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRequest) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 400 },
      );
    }

    if (resetRequest.usedAt) {
      return NextResponse.json(
        { success: false, error: "Token has already been used" },
        { status: 400 },
      );
    }

    if (new Date() > resetRequest.expiresAt) {
      return NextResponse.json(
        { success: false, error: "Token has expired" },
        { status: 400 },
      );
    }

    const hashedPassword = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRequest.userId },
        data: { passwordHash: hashedPassword },
      }),
      prisma.passwordReset.update({
        where: { id: resetRequest.id },
        data: { usedAt: new Date() },
      }),
      prisma.refreshToken.deleteMany({
        where: { userId: resetRequest.userId },
      }),
    ]);

    sendPasswordResetConfirmationEmail(
      resetRequest.user.email,
      resetRequest.user.name || undefined,
    ).catch((err) => console.error("[RESET_PASSWORD_CONFIRMATION_ERROR]", err));

    console.log(
      `[AUTH_AUDIT] Password successfully reset for user: ${resetRequest.userId}`,
    );

    return NextResponse.json(
      { success: true, message: "Password has been reset successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("[RESET_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

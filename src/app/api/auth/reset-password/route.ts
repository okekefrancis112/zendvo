import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { validatePassword } from "@/lib/validation";
import { sendPasswordResetConfirmationEmail } from "@/server/services/emailService";
import {
  completePasswordReset,
  findPasswordResetByToken,
} from "@/server/db/authRepository";

const BCRYPT_COST = 12;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, newPassword } = body;
    const nextPassword = newPassword ?? password;

    if (!token || !nextPassword) {
      return NextResponse.json(
        { success: false, error: "Token and new password are required" },
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

    if (!validatePassword(nextPassword)) {
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

    const resetRequest = await findPasswordResetByToken(token);

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

    const hashedPassword = await bcrypt.hash(nextPassword, BCRYPT_COST);

    await completePasswordReset({
      resetId: resetRequest.id,
      userId: resetRequest.userId,
      passwordHash: hashedPassword,
    });

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

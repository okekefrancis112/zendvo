import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  validateEmail,
  validatePassword,
  sanitizeInput,
} from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    // 1. Validate Content-Type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Content-Type. Expected application/json",
        },
        { status: 400 },
      );
    }

    // 1.5. Request Body Size Limit (10KB)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 10240) {
      return NextResponse.json(
        { success: false, error: "Request body too large" },
        { status: 413 },
      );
    }

    // 1.6. CSRF Protection (Basic Origin Validation)
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json(
        { success: false, error: "CSRF protection: Invalid origin" },
        { status: 403 },
      );
    }

    // 2. Rate Limiting (max 5 registration attempts per IP per hour)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many registration attempts. Please try again later.",
        },
        { status: 429 },
      );
    }

    // 3. Parse Request Body
    const body = await request.json();
    const { email, password, name } = body;

    // 4. Validate Missing Fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      );
    }

    const sanitizedEmail = sanitizeInput(email);

    // 5. Validate Email Format
    if (!validateEmail(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 },
      );
    }

    // 6. Validate Password Strength
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

    // 7. Check for Duplicate Email
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 },
      );
    }

    // 8. Hash Password
    const passwordHash = await hashPassword(password);

    // 9. Create User Record
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        passwordHash,
        name: name ? sanitizeInput(name) : null,
        status: "unverified",
      },
    });

    // 10. Return Success Response
    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        data: {
          userId: user.id,
          email: user.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);

    // Handle specific Prisma errors (e.g. database connection issues)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

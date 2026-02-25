import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateAmount,
  validateCurrency,
  validateEmail,
  validateFutureDatetime,
  sanitizeInput,
} from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limiter";
import { validateHoneypot } from "@/lib/honeypot";

const MAX_MESSAGE_LENGTH = 500;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting — 10 requests per minute per IP
    const ip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";
    if (isRateLimited(ip, 10, 60_000)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();

    // Honeypot check — return fake success so bots don't adapt
    if (!validateHoneypot(body)) {
      console.warn("[PUBLIC_GIFT] Honeypot triggered, rejecting bot request");
      return NextResponse.json(
        {
          success: true,
          data: {
            giftId: crypto.randomUUID(),
            status: "pending_review",
          },
        },
        { status: 201 },
      );
    }

    const {
      recipientId,
      amount,
      currency,
      unlockDatetime,
      hideAmount,
      message,
      senderName,
      senderEmail,
      senderAvatar,
    } = body;

    // Validate required fields
    if (!recipientId || !amount || !currency || !senderName || !senderEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "recipientId, amount, currency, senderName, and senderEmail are required",
        },
        { status: 400 },
      );
    }

    // Validate amount
    if (typeof amount !== "number" || !validateAmount(amount)) {
      return NextResponse.json(
        {
          success: false,
          error: "Amount must be a positive number not exceeding 10,000",
        },
        { status: 422 },
      );
    }

    // Validate currency
    if (typeof currency !== "string" || !validateCurrency(currency)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported currency. Accepted: USD, EUR, GBP, NGN",
        },
        { status: 422 },
      );
    }

    // Validate sender email
    if (typeof senderEmail !== "string" || !validateEmail(senderEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid sender email address" },
        { status: 422 },
      );
    }

    // Validate delivery datetime (if provided, must be in the future)
    if (unlockDatetime !== undefined && unlockDatetime !== null) {
      const parsedDate = new Date(unlockDatetime);
      if (!validateFutureDatetime(parsedDate)) {
        return NextResponse.json(
          {
            success: false,
            error: "Delivery datetime must be a valid date in the future",
          },
          { status: 422 },
        );
      }
    }

    // Validate message length
    if (message && typeof message === "string" && message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: `Message must not exceed ${MAX_MESSAGE_LENGTH} characters`,
        },
        { status: 422 },
      );
    }

    // Check recipient exists
    const recipientUser = await prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipientUser) {
      return NextResponse.json(
        { success: false, error: "Recipient not found" },
        { status: 404 },
      );
    }

    // Duplicate detection — same senderEmail + recipientId + amount within 5 minutes
    const sanitizedSenderEmail = sanitizeInput(senderEmail).toLowerCase();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const duplicate = await prisma.gift.findFirst({
      where: {
        senderEmail: sanitizedSenderEmail,
        recipientId,
        amount,
        createdAt: { gte: fiveMinutesAgo },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A similar gift was recently submitted. Please wait before trying again.",
        },
        { status: 409 },
      );
    }

    // Sanitize inputs
    const sanitizedMessage = message ? sanitizeInput(message) : null;
    const sanitizedSenderName = sanitizeInput(senderName);
    const sanitizedSenderAvatar = senderAvatar
      ? sanitizeInput(senderAvatar)
      : null;

    // Create gift record
    const gift = await prisma.gift.create({
      data: {
        recipientId,
        amount,
        currency: currency.toUpperCase(),
        message: sanitizedMessage,
        status: "pending_review",
        hideAmount: hideAmount ?? false,
        unlockDatetime: unlockDatetime ? new Date(unlockDatetime) : null,
        senderName: sanitizedSenderName,
        senderEmail: sanitizedSenderEmail,
        senderAvatar: sanitizedSenderAvatar,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          giftId: gift.id,
          status: "pending_review",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[PUBLIC_GIFT_CREATE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateProcessingFee } from "@/lib/fees";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ giftId: string }> },
) {
  try {
    const { giftId } = await params;

    const gift = await prisma.gift.findUnique({
      where: { id: giftId },
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sender: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!gift) {
      return NextResponse.json(
        { success: false, error: "Gift not found" },
        { status: 404 },
      );
    }

    if (gift.status !== "pending_review") {
      return NextResponse.json(
        { success: false, error: "Gift is not in pending_review status" },
        { status: 400 },
      );
    }

    const processingFee = calculateProcessingFee(gift.amount);
    const totalAmount = gift.amount + processingFee;

    return NextResponse.json(
      {
        success: true,
        data: {
          recipient: {
            id: gift.recipient.id,
            name: gift.recipient.name,
            email: gift.recipient.email,
          },
          amount: gift.amount,
          currency: gift.currency,
          processingFee,
          totalAmount,
          privacySettings: {
            hideAmount: gift.hideAmount,
            hideSender: gift.hideSender,
          },
          unlockDatetime: gift.unlockDatetime,
          message: gift.message,
          senderName: gift.sender.name,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching gift summary:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

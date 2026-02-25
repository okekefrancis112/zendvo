import { GET } from "@/app/api/gifts/public/[giftId]/summary/route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    gift: {
      findUnique: jest.fn(),
    },
  },
}));

describe("GET /api/gifts/public/:giftId/summary", () => {
  const mockGift = {
    id: "gift-123",
    senderId: "sender-123",
    recipientId: "recipient-123",
    amount: 10000,
    currency: "NGN",
    message: "Happy Birthday!",
    status: "pending_review",
    hideAmount: false,
    hideSender: false,
    unlockDatetime: new Date("2026-03-01T12:00:00Z"),
    recipient: {
      id: "recipient-123",
      name: "John Doe",
      email: "john@example.com",
    },
    sender: {
      name: "Jane Smith",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 with full gift summary", async () => {
    (prisma.gift.findUnique as jest.Mock).mockResolvedValue(mockGift);

    const request = new NextRequest(
      "http://localhost:3000/api/gifts/public/gift-123/summary",
    );
    const params = Promise.resolve({ giftId: "gift-123" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toMatchObject({
      recipient: {
        id: "recipient-123",
        name: "John Doe",
        email: "john@example.com",
      },
      amount: 10000,
      currency: "NGN",
      processingFee: 250,
      totalAmount: 10250,
      privacySettings: {
        hideAmount: false,
        hideSender: false,
      },
      unlockDatetime: mockGift.unlockDatetime.toISOString(),
      message: "Happy Birthday!",
      senderName: "Jane Smith",
    });
  });

  it("should return 404 if gift does not exist", async () => {
    (prisma.gift.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/gifts/public/gift-123/summary",
    );
    const params = Promise.resolve({ giftId: "gift-123" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Gift not found");
  });

  it("should return 400 if gift status is not pending_review", async () => {
    (prisma.gift.findUnique as jest.Mock).mockResolvedValue({
      ...mockGift,
      status: "confirmed",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/gifts/public/gift-123/summary",
    );
    const params = Promise.resolve({ giftId: "gift-123" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Gift is not in pending_review status");
  });

  it("should calculate processing fee correctly for different amounts", async () => {
    const testCases = [
      { amount: 1000, expectedFee: 50 }, // Min fee applies
      { amount: 10000, expectedFee: 250 }, // 2.5%
      { amount: 100000, expectedFee: 2500 }, // 2.5%
      { amount: 300000, expectedFee: 5000 }, // Max fee applies
    ];

    for (const { amount, expectedFee } of testCases) {
      (prisma.gift.findUnique as jest.Mock).mockResolvedValue({
        ...mockGift,
        amount,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/gifts/public/gift-123/summary",
      );
      const params = Promise.resolve({ giftId: "gift-123" });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(data.data.processingFee).toBe(expectedFee);
      expect(data.data.totalAmount).toBe(amount + expectedFee);
    }
  });
});

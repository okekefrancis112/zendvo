import { NextRequest } from "next/server";
import { GET } from "@/app/api/gifts/[giftId]/route";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    gift: {
      findUnique: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const mockGift = {
  id: "gift-123",
  senderId: "sender-123",
  recipientId: "recipient-456",
  amount: 150,
  currency: "USD",
  message: "Happy birthday!",
  template: "birthday",
  status: "pending_otp",
  recipient: {
    id: "recipient-456",
    name: "Recipient User",
    email: "recipient@example.com",
  },
};

function makeRequest(giftId: string, userId?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (userId) {
    headers["x-user-id"] = userId;
  }

  return new NextRequest(`http://localhost/api/gifts/${giftId}`, {
    method: "GET",
    headers,
  });
}

describe("GET /api/gifts/:giftId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 with full gift details for creator", async () => {
    (mockPrisma.gift.findUnique as jest.Mock).mockResolvedValue(mockGift);

    const response = await GET(makeRequest("gift-123", "sender-123"), {
      params: Promise.resolve({ giftId: "gift-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual({
      id: "gift-123",
      recipient: {
        id: "recipient-456",
        name: "Recipient User",
        email: "recipient@example.com",
      },
      amount: 150,
      currency: "USD",
      message: "Happy birthday!",
      template: "birthday",
      status: "pending_otp",
    });
  });

  it("should return 401 when unauthenticated", async () => {
    const response = await GET(makeRequest("gift-123"), {
      params: Promise.resolve({ giftId: "gift-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 404 when gift does not exist", async () => {
    (mockPrisma.gift.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await GET(makeRequest("gift-999", "sender-123"), {
      params: Promise.resolve({ giftId: "gift-999" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Gift not found");
  });

  it("should return 403 when requester is not the gift creator", async () => {
    (mockPrisma.gift.findUnique as jest.Mock).mockResolvedValue(mockGift);

    const response = await GET(makeRequest("gift-123", "other-user-000"), {
      params: Promise.resolve({ giftId: "gift-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Forbidden");
  });

  it("should return 404 when gift status is not reviewable", async () => {
    (mockPrisma.gift.findUnique as jest.Mock).mockResolvedValue({
      ...mockGift,
      status: "completed",
    });

    const response = await GET(makeRequest("gift-123", "sender-123"), {
      params: Promise.resolve({ giftId: "gift-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Gift not found");
  });
});

import { GET } from "@/app/api/users/lookup/route";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limiter";
import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/rate-limiter", () => ({
  isRateLimited: jest.fn(() => false),
}));

function makeRequest(phone?: string): NextRequest {
  const url = new URL("http://localhost:3000/api/users/lookup");
  if (phone !== undefined) {
    url.searchParams.set("phone", phone);
  }
  return new NextRequest(url);
}

describe("GET /api/users/lookup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isRateLimited as jest.Mock).mockReturnValue(false);
  });

  it("should return 400 when phone parameter is missing", async () => {
    const response = await GET(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Phone number is required");
  });

  it("should return 400 for invalid phone number format", async () => {
    const response = await GET(makeRequest("abc"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid phone number format");
  });

  it("should return 400 when phone number exceeds max length", async () => {
    const longPhone = "1".repeat(31);
    const response = await GET(makeRequest(longPhone));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid phone number format");
  });

  it("should return 404 when no user matches the phone number", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await GET(makeRequest("+2348112345678"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("User not found");
  });

  it("should return 200 with displayName, username, and avatarUrl", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      name: "John Eze",
      username: "johneze",
      avatarUrl: "https://example.com/avatar.jpg",
    });

    const response = await GET(makeRequest("+2348112345678"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual({
      displayName: "John Eze",
      username: "johneze",
      avatarUrl: "https://example.com/avatar.jpg",
    });
  });

  it("should normalize phone number by stripping dashes and spaces", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      name: "Jane",
      username: null,
      avatarUrl: null,
    });

    await GET(makeRequest("+234-811 234-5678"));

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { phoneNumber: "+2348112345678" },
      select: { name: true, username: true, avatarUrl: true },
    });
  });

  it("should return null for missing optional fields", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      name: null,
      username: null,
      avatarUrl: null,
    });

    const response = await GET(makeRequest("+2348000000000"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual({
      displayName: null,
      username: null,
      avatarUrl: null,
    });
  });

  it("should return 429 when rate limited", async () => {
    (isRateLimited as jest.Mock).mockReturnValue(true);

    const response = await GET(makeRequest("+2348112345678"));
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Too many requests. Please try again later.");
  });

  it("should call rate limiter with lookup-prefixed key", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await GET(makeRequest("+2348112345678"));

    expect(isRateLimited).toHaveBeenCalledWith(
      "lookup:127.0.0.1",
      20,
      60_000,
    );
  });

  it("should return 500 on database error", async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(
      new Error("DB connection failed"),
    );

    const response = await GET(makeRequest("+2348112345678"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Internal server error");
  });

  it("should not include sensitive data in response", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      name: "John Eze",
      username: "johneze",
      avatarUrl: null,
    });

    const response = await GET(makeRequest("+2348112345678"));
    const data = await response.json();

    expect(data.data).not.toHaveProperty("email");
    expect(data.data).not.toHaveProperty("passwordHash");
    expect(data.data).not.toHaveProperty("id");
    expect(data.data).not.toHaveProperty("walletBalance");
  });
});

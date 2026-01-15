import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ gifts: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ message: "Gift created", gift: body });
}

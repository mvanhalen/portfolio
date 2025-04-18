import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (password === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: true }, { status: 200 });
    }
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
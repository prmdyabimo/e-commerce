import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    // Mock validation: accept any password with length >= 4 and an @ in email
    if (!email.includes("@") || String(password).length < 4) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Return a mock user and token
    const user = { id: "u_1", email };
    const token = "mock-token-12345";

    return NextResponse.json({ user, token });
  } catch (err: any) {
    return NextResponse.json({ message: String(err) }, { status: 500 });
  }
}

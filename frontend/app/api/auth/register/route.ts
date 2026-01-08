import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Name, email and password are required" }, { status: 400 });
    }

    if (!email.includes("@") || String(password).length < 4) {
      return NextResponse.json({ message: "Invalid registration data" }, { status: 400 });
    }

    // Mock user creation: return created user and token
    const user = { id: "u_2", name, email };
    const token = "mock-token-67890";

    return NextResponse.json({ user, token }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: String(err) }, { status: 500 });
  }
}

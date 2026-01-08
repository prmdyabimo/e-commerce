import { NextResponse } from "next/server";

type User = { id: string; name?: string; email: string };

const users: User[] = [
  { id: "u_1", name: "Demo User", email: "demo@local" },
  { id: "u_2", name: "Another", email: "other@local" },
];

export async function GET() {
  return NextResponse.json(users);
}

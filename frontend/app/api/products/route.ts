import { NextResponse } from "next/server";

type Product = { id: string; name: string; price: number; description?: string };

// In-memory product store for demo purposes
export const products: Product[] = [
  { id: "p_1", name: "Sample product", price: 19.99, description: "An example item" },
];

function genId() {
  return "p_" + Math.random().toString(36).slice(2, 9);
}

export async function GET() {
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, description } = body || {};
    if (!name || typeof price !== "number") {
      return NextResponse.json({ message: "Invalid product" }, { status: 400 });
    }
    const p = { id: genId(), name, price, description };
    products.push(p);
    return NextResponse.json(p, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ message: String(err) }, { status: 500 });
  }
}

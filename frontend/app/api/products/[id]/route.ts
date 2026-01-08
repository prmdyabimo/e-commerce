import { NextResponse } from "next/server";

type Product = { id: string; name: string; price: number; description?: string };

// NOTE: Uses same in-memory store as parent file (module scope in Node dev server)
declare const global: any;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  // Try to access products from module cache
  const prodModule = await import("../route");
  const products: Product[] = (prodModule as any).products || [];
  const item = products.find((p) => p.id === id);
  if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();
    const prodModule = await import("../route");
    const products: Product[] = (prodModule as any).products || [];
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return NextResponse.json({ message: "Not found" }, { status: 404 });
    products[idx] = { ...products[idx], ...body };
    return NextResponse.json(products[idx]);
  } catch (err: unknown) {
    return NextResponse.json({ message: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const prodModule = await import("../route");
  const products: Product[] = (prodModule as any).products || [];
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ message: "Not found" }, { status: 404 });
  products.splice(idx, 1);
  return NextResponse.json({ success: true });
}

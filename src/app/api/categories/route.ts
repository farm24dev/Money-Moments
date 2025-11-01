import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "ต้องเข้าสู่ระบบก่อน" },
      { status: 401 },
    );
  }

  const categories = await prisma.savingCategory.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      _count: {
        select: {
          savingEntries: true,
        },
      },
    },
  });

  return NextResponse.json({ success: true, data: categories });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "ต้องเข้าสู่ระบบก่อน" },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "รูปแบบข้อมูลไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { success: false, message: "รูปแบบข้อมูลไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const raw = body as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const description =
    typeof raw.description === "string" && raw.description.trim().length > 0
      ? raw.description.trim()
      : null;

  if (!name) {
    return NextResponse.json(
      { success: false, message: "กรุณาระบุชื่อหมวดหมู่" },
      { status: 400 },
    );
  }

  if (name.length > 64) {
    return NextResponse.json(
      { success: false, message: "ชื่อหมวดหมู่ต้องไม่เกิน 64 ตัวอักษร" },
      { status: 400 },
    );
  }

  if (description && description.length > 256) {
    return NextResponse.json(
      { success: false, message: "คำอธิบายต้องไม่เกิน 256 ตัวอักษร" },
      { status: 400 },
    );
  }

  try {
    const category = await prisma.savingCategory.create({
      data: {
        name,
        description,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "มีชื่อหมวดหมู่นี้แล้ว" },
        { status: 409 },
      );
    }

    console.error("Failed to create category", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถบันทึกหมวดหมู่ได้ กรุณาลองใหม่" },
      { status: 500 },
    );
  }
}

import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const name =
    typeof body === "object" && body !== null && "name" in body
      ? String((body as Record<string, unknown>).name).trim()
      : "";

  if (!name) {
    return NextResponse.json(
      { success: false, message: "กรุณาระบุชื่อสมาชิก" },
      { status: 400 },
    );
  }

  if (name.length > 64) {
    return NextResponse.json(
      { success: false, message: "ชื่อต้องไม่เกิน 64 ตัวอักษร" },
      { status: 400 },
    );
  }

  try {
    const person = await prisma.person.create({
      data: {
        name,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({ success: true, data: person }, { status: 201 });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "ชื่อสมาชิกนี้ถูกใช้งานแล้ว" },
        { status: 409 },
      );
    }

    console.error("Failed to create person", error);

    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" },
      { status: 500 },
    );
  }
}

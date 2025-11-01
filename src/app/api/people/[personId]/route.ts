import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ personId: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "ต้องเข้าสู่ระบบก่อน" },
      { status: 401 },
    );
  }

  const { personId: personIdParam } = await params;

  const personId = Number(personIdParam);

  if (!Number.isInteger(personId)) {
    return NextResponse.json(
      { success: false, message: "รหัสสมาชิกไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      userId: session.user.id,
    },
    include: {
      _count: {
        select: { savingEntries: true },
      },
    },
  });

  if (!person) {
    return NextResponse.json(
      { success: false, message: "ไม่พบสมาชิกที่ต้องการลบ" },
      { status: 404 },
    );
  }

  const forceDelete = new URL(request.url).searchParams.get("force") === "true";

  if (!forceDelete && person._count.savingEntries > 0) {
    return NextResponse.json(
      {
        success: false,
        requiresConfirmation: true,
        message: "สมาชิกคนนี้มีประวัติการออมอยู่ ลบแล้วยอดทั้งหมดจะหาย ต้องการลบหรือไม่?",
      },
      { status: 409 },
    );
  }

  try {
    await prisma.person.delete({
      where: { id: personId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete person", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถลบสมาชิกได้ กรุณาลองใหม่" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyDeposit, notifyWithdraw } from "@/lib/line-notify";

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

  const personId = Number(raw.personId);
  const amountValue = Number(raw.amount);
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  const categoryId =
    raw.categoryId === null || raw.categoryId === undefined
      ? null
      : Number(raw.categoryId);
  const type = typeof raw.type === "string" ? raw.type : "deposit";
  const transactionDate = typeof raw.transactionDate === "string" ? raw.transactionDate : null;

  if (!Number.isInteger(personId)) {
    return NextResponse.json(
      { success: false, message: "กรุณาเลือกสมาชิก" },
      { status: 400 },
    );
  }

  if (!transactionDate) {
    return NextResponse.json(
      { success: false, message: "กรุณาเลือกวันที่ทำรายการ" },
      { status: 400 },
    );
  }

  if (type !== "deposit" && type !== "withdraw") {
    return NextResponse.json(
      { success: false, message: "ประเภทรายการไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  if (!label) {
    return NextResponse.json(
      { success: false, message: "กรุณาระบุรายการที่ต้องการเก็บ" },
      { status: 400 },
    );
  }

  if (label.length > 128) {
    return NextResponse.json(
      { success: false, message: "รายการต้องไม่เกิน 128 ตัวอักษร" },
      { status: 400 },
    );
  }

  if (!Number.isFinite(amountValue) || amountValue <= 0) {
    return NextResponse.json(
      { success: false, message: "จำนวนเงินต้องมากกว่า 0" },
      { status: 400 },
    );
  }

  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      userId: session.user.id,
    },
    select: { id: true, name: true },
  });

  if (!person) {
    return NextResponse.json(
      { success: false, message: "ไม่พบสมาชิกที่เลือก" },
      { status: 404 },
    );
  }

  let categoryConnect: { connect: { id: number } } | undefined;
  let categoryName: string | null = null;

  if (categoryId !== null) {
    if (!Number.isInteger(categoryId)) {
      return NextResponse.json(
        { success: false, message: "หมวดหมู่ไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const category = await prisma.savingCategory.findFirst({
      where: {
        id: categoryId,
        userId: session.user.id,
      },
      select: { id: true, name: true },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "ไม่พบหมวดหมู่ที่เลือก" },
        { status: 404 },
      );
    }

    categoryConnect = { connect: { id: category.id } };
    categoryName = category.name;
  }

  try {
    const entry = await prisma.savingEntry.create({
      data: {
        amount: amountValue.toString(),
        label,
        type,
        transactionDate: new Date(transactionDate),
        person: {
          connect: { id: person.id },
        },
        category: categoryConnect,
      },
      select: {
        id: true,
      },
    });

    // Send LINE notification for both deposits and withdrawals
    if (type === "deposit" || type === "withdraw") {
      // Calculate balance for this person
      const allEntries = await prisma.savingEntry.findMany({
        where: { personId: person.id },
        select: { amount: true, type: true },
      });

      const balance = allEntries.reduce((sum, e) => {
        const amt = Number(e.amount);
        return e.type === "withdraw" ? sum - amt : sum + amt;
      }, 0);

      // Send notification asynchronously without blocking the response
      const notifyFunction = type === "deposit" ? notifyDeposit : notifyWithdraw;

      notifyFunction({
        personName: person.name,
        amount: amountValue,
        label,
        categoryName,
        transactionDate: new Date(transactionDate),
        balance,
      }).catch((error) => {
        console.error("Failed to send LINE notification:", error);
      });
    }

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error("Failed to create saving entry", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถบันทึกยอดออมได้ กรุณาลองใหม่" },
      { status: 500 },
    );
  }
}

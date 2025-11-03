import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifySummary } from "@/lib/line-notify";

type RouteParams = {
    params: Promise<{
        personId: string;
    }>;
};

export async function POST(request: NextRequest, context: RouteParams) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: "กรุณาเข้าสู่ระบบก่อน" },
                { status: 401 }
            );
        }

        const { personId: personIdParam } = await context.params;
        const personId = Number(personIdParam);

        if (!Number.isInteger(personId) || personId <= 0) {
            return NextResponse.json(
                { success: false, message: "รหัสสมาชิกไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        // Check if person exists and belongs to user
        const person = await prisma.person.findFirst({
            where: {
                id: personId,
                userId: session.user.id,
            },
            select: {
                id: true,
                name: true,
                savingEntries: {
                    select: {
                        amount: true,
                        type: true,
                    },
                },
            },
        });

        if (!person) {
            return NextResponse.json(
                { success: false, message: "ไม่พบสมาชิกนี้" },
                { status: 404 }
            );
        }

        // Calculate statistics
        const deposits = person.savingEntries.filter((e) => e.type === "deposit");
        const withdrawals = person.savingEntries.filter((e) => e.type === "withdraw");

        const depositCount = deposits.length;
        const withdrawCount = withdrawals.length;

        const totalDeposit = deposits.reduce((sum, e) => sum + Number(e.amount), 0);
        const totalWithdraw = withdrawals.reduce((sum, e) => sum + Number(e.amount), 0);

        const balance = totalDeposit - totalWithdraw;

        // Send summary to LINE
        const success = await notifySummary({
            personName: person.name,
            depositCount,
            withdrawCount,
            totalDeposit,
            totalWithdraw,
            balance,
        });

        if (!success) {
            return NextResponse.json(
                { success: false, message: "ไม่สามารถส่งข้อความไปยัง LINE ได้" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "ส่งสรุปไปยัง LINE เรียบร้อยแล้ว",
        });
    } catch (error) {
        console.error("Error sending summary to LINE:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในการส่งสรุป" },
            { status: 500 }
        );
    }
}

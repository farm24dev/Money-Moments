import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
    params: Promise<{
        categoryId: string;
    }>;
};

export async function DELETE(request: NextRequest, context: RouteParams) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: "กรุณาเข้าสู่ระบบก่อน" },
                { status: 401 }
            );
        }

        const { categoryId: categoryIdParam } = await context.params;
        const categoryId = Number(categoryIdParam);

        if (!Number.isInteger(categoryId) || categoryId <= 0) {
            return NextResponse.json(
                { success: false, message: "รหัสหมวดหมู่ไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        // Check if category exists and belongs to user
        const category = await prisma.savingCategory.findFirst({
            where: {
                id: categoryId,
                userId: session.user.id,
            },
            include: {
                _count: {
                    select: { savingEntries: true },
                },
            },
        });

        if (!category) {
            return NextResponse.json(
                { success: false, message: "ไม่พบหมวดหมู่นี้" },
                { status: 404 }
            );
        }

        const { searchParams } = new URL(request.url);
        const force = searchParams.get("force") === "true";

        // If category has entries and not forcing, require confirmation
        if (category._count.savingEntries > 0 && !force) {
            return NextResponse.json(
                {
                    success: false,
                    message: `หมวดหมู่ ${category.name} มีการบันทึก ${category._count.savingEntries} รายการ รายการจะไม่ถูกลบแต่จะไม่มีหมวดหมู่ ต้องการลบหรือไม่?`,
                    requiresConfirmation: true,
                },
                { status: 400 }
            );
        }

        // Delete the category
        await prisma.savingCategory.delete({
            where: { id: categoryId },
        });

        return NextResponse.json({
            success: true,
            message: `ลบหมวดหมู่ ${category.name} เรียบร้อยแล้ว`,
        });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในการลบหมวดหมู่" },
            { status: 500 }
        );
    }
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { AddCategoryForm } from "@/app/components/AddCategoryForm";
import { DeleteCategoryButton } from "@/app/components/DeleteCategoryButton";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonClassName } from "@/lib/button-classes";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 2,
});

async function getCategories(userId: string) {
  const categories = await prisma.savingCategory.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      savingEntries: {
        select: { amount: true },
      },
      _count: {
        select: { savingEntries: true },
      },
    },
  });

  return categories.map((category) => {
    const totalAmount = category.savingEntries.reduce(
      (sum, entry) => sum + Number(entry.amount),
      0,
    );

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      entryCount: category._count.savingEntries,
      totalAmount,
    };
  });
}

export default async function CategoriesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const categories = await getCategories(session.user.id);
  const totalAmount = categories.reduce((sum, category) => sum + category.totalAmount, 0);
  const activeCategories = categories.filter((category) => category.entryCount > 0).length;

  return (
    <AppShell>
      <div className="space-y-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              จัดการหมวดหมู่การออม
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              เพิ่ม แก้ไข และวิเคราะห์หมวดหมู่เพื่อช่วยให้การออมเป็นระบบมากขึ้น
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge className="bg-secondary text-secondary-foreground">
                หมวดหมู่ทั้งหมด {categories.length}
              </Badge>
              <Badge className="bg-primary/15 text-primary">
                ใช้งานจริง {activeCategories}
              </Badge>
            </div>
          </div>
          <Link
            href="/"
            className={buttonClassName({ variant: "outline" })}
          >
            กลับหน้าหลัก
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <AddCategoryForm />
          <Card>
            <CardHeader>
              <CardTitle>สรุปภาพรวมหมวดหมู่</CardTitle>
              <CardDescription>
                สถิติยอดรวมจากทุกหมวดหมู่และหมวดหมู่ที่มีการบันทึกบ่อย
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Card className="border border-border/60 bg-muted/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    ยอดออมในทุกหมวดหมู่
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tracking-tight">
                    {currencyFormatter.format(totalAmount)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    รวมเฉพาะรายการที่จัดหมวดหมู่แล้ว
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-border/60 bg-muted/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    หมวดหมู่ยอดนิยม
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {categories.length > 0 ? (
                    categories
                      .slice()
                      .sort((a, b) => b.entryCount - a.entryCount)
                      .slice(0, 3)
                      .map((category) => (
                        <div key={category.id} className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{category.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {category.entryCount.toLocaleString("th-TH")}
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      ยังไม่มีหมวดหมู่ในระบบ
                    </p>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">รายการหมวดหมู่</h2>
            <p className="text-sm text-muted-foreground">
              แสดงจำนวนครั้งที่ใช้งานและยอดรวมของแต่ละหมวดหมู่
            </p>
          </div>
          {categories.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border/60 text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">ชื่อหมวดหมู่</th>
                      <th className="px-4 py-3">คำอธิบาย</th>
                      <th className="px-4 py-3 text-right">จำนวนครั้งที่บันทึก</th>
                      <th className="px-4 py-3 text-right">ยอดรวม</th>
                      <th className="px-4 py-3 text-center">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-muted/40">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {category.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {category.description ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                          {category.entryCount.toLocaleString("th-TH")}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          {currencyFormatter.format(category.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <DeleteCategoryButton
                            categoryId={category.id}
                            categoryName={category.name}
                            hasEntries={category.entryCount > 0}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              ยังไม่มีหมวดหมู่ เริ่มเพิ่มหมวดหมู่ใหม่ได้ทางแบบฟอร์มด้านซ้ายมือ
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}

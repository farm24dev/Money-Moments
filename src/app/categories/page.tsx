import Link from "next/link";
import { redirect } from "next/navigation";

import { AddCategoryForm } from "@/app/components/AddCategoryForm";
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

  return (
    <div className="min-h-screen bg-zinc-100 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">
              จัดการหมวดหมู่การออม
            </h1>
            <p className="text-sm text-zinc-600">
              เพิ่มหรือจัดระเบียบหมวดหมู่เพื่อให้ง่ายต่อการบันทึกยอดออม
            </p>
          </div>
          <Link
            href="/"
            className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
          >
            กลับหน้าหลัก
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <AddCategoryForm />
          <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">สรุป</h2>
              <p className="text-sm text-zinc-500">
                หมวดหมู่ทั้งหมด {categories.length} รายการ
              </p>
            </div>
            <div className="grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                <p className="text-xs uppercase text-blue-600">ยอดออมในทุกหมวดหมู่</p>
                <p className="mt-1 text-lg font-semibold text-blue-900">
                  {currencyFormatter.format(
                    categories.reduce((sum, category) => sum + category.totalAmount, 0),
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-purple-100 bg-purple-50/60 p-3">
                <p className="text-xs uppercase text-purple-600">หมวดหมู่ที่ใช้งาน</p>
                <p className="mt-1 text-lg font-semibold text-purple-900">
                  {
                    categories.filter((category) => category.entryCount > 0).length
                  } หมวดหมู่
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">รายการหมวดหมู่</h2>
            <p className="text-sm text-zinc-600">
              ดูจำนวนครั้งที่ใช้งานและยอดรวมทั้งหมวดหมู่
            </p>
          </div>
          {categories.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">ชื่อหมวดหมู่</th>
                    <th className="px-4 py-3">คำอธิบาย</th>
                    <th className="px-4 py-3 text-right">จำนวนครั้งที่บันทึก</th>
                    <th className="px-4 py-3 text-right">ยอดรวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3 font-medium text-zinc-800">
                        {category.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {category.description ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-600">
                        {category.entryCount.toLocaleString("th-TH")}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-zinc-900">
                        {currencyFormatter.format(category.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
              ยังไม่มีหมวดหมู่ เริ่มเพิ่มหมวดหมู่ใหม่ได้ทางแบบฟอร์มด้านบน
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

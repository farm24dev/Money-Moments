import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DeletePersonButton } from "@/app/components/DeletePersonButton";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
});

async function getPersonHistory(userId: string, personId: number) {
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      userId,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      savingEntries: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          label: true,
          amount: true,
          createdAt: true,
          category: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!person) {
    return null;
  }

  const totalAmount = person.savingEntries.reduce(
    (sum, entry) => sum + Number(entry.amount),
    0,
  );

  const entries = person.savingEntries.map((entry) => ({
    id: entry.id,
    label: entry.label,
    categoryName: entry.category?.name ?? null,
    amount: Number(entry.amount),
    createdAt: entry.createdAt,
  }));

  return {
    person: {
      id: person.id,
      name: person.name,
      createdAt: person.createdAt,
    },
    totalAmount,
    entries,
  };
}

export default async function PersonHistoryPage({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { personId: personIdParam } = await params;

  const personId = Number(personIdParam);

  if (!Number.isInteger(personId)) {
    notFound();
  }

  const data = await getPersonHistory(session.user.id, personId);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-100 py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">
              ประวัติของ {data.person.name}
            </h1>
            <p className="text-sm text-zinc-600">
              เริ่มบันทึกตั้งแต่ {dateTimeFormatter.format(new Date(data.person.createdAt))}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/history"
              className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
            >
              ดูประวัติทั้งหมด
            </Link>
            <Link
              href="/"
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-blue-600">ยอดออมทั้งหมด</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {currencyFormatter.format(data.totalAmount)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-emerald-600">จำนวนครั้งที่บันทึก</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {data.entries.length.toLocaleString("th-TH")} ครั้ง
            </p>
          </div>
          <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-red-600">การจัดการ</p>
            <DeletePersonButton
              personId={data.person.id}
              personName={data.person.name}
              redirectTo="/history"
            />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">รายการบันทึก</h2>
            <p className="text-sm text-zinc-600">เรียงตามเวลาจากใหม่ไปเก่า</p>
          </div>
          {data.entries.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">หมวดหมู่</th>
                    <th className="px-4 py-3">รายการ</th>
                    <th className="px-4 py-3 text-right">จำนวนเงิน</th>
                    <th className="px-4 py-3">บันทึกเมื่อ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data.entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3 text-zinc-600">
                        {entry.categoryName ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{entry.label}</td>
                      <td className="px-4 py-3 text-right font-semibold text-zinc-900">
                        {currencyFormatter.format(entry.amount)}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {dateTimeFormatter.format(new Date(entry.createdAt))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
              ยังไม่มีประวัติการออมสำหรับสมาชิกคนนี้
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

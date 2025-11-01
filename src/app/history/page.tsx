import Link from "next/link";
import { redirect } from "next/navigation";

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

async function getHistoryData(userId: string) {
  const [people, entries] = await Promise.all([
    prisma.person.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: {
        savingEntries: {
          select: { amount: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { savingEntries: true },
        },
      },
    }),
    prisma.savingEntry.findMany({
      where: {
        person: {
          userId,
        },
      },
      include: {
        person: {
          select: { id: true, name: true },
        },
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const personSummaries = people.map((person) => {
    const totalAmount = person.savingEntries.reduce(
      (sum, entry) => sum + Number(entry.amount),
      0,
    );

    return {
      id: person.id,
      name: person.name,
      totalAmount,
      entryCount: person._count.savingEntries,
      lastEntryAt: person.savingEntries[0]?.createdAt ?? null,
    };
  });

  const entryList = entries.map((entry) => ({
    id: entry.id,
    personId: entry.person.id,
    personName: entry.person.name,
    categoryName: entry.category?.name ?? null,
    label: entry.label,
    amount: Number(entry.amount),
    createdAt: entry.createdAt,
  }));

  const totalSaved = entryList.reduce((sum, entry) => sum + entry.amount, 0);

  return {
    personSummaries,
    entries: entryList,
    totalSaved,
  };
}

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = await getHistoryData(session.user.id);

  return (
    <div className="min-h-screen bg-zinc-100 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">ประวัติการออมทั้งหมด</h1>
            <p className="text-sm text-zinc-600">
              ตรวจสอบประวัติการบันทึกยอดออมของทุกคนและรายละเอียดการบันทึกแต่ละครั้ง
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
            >
              กลับหน้าหลัก
            </Link>
            <Link
              href="/categories"
              className="rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 transition hover:bg-purple-100"
            >
              จัดการหมวดหมู่
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-blue-600">ยอดออมรวมทั้งหมด</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {currencyFormatter.format(data.totalSaved)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-emerald-600">จำนวนสมาชิก</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {data.personSummaries.length} คน
            </p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-amber-600">จำนวนการบันทึก</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {data.entries.length.toLocaleString("th-TH")}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900">สรุปตามสมาชิก</h2>
            <p className="text-sm text-zinc-600">กดชื่อสมาชิกเพื่อดูประวัติแบบละเอียด</p>
          </div>
          {data.personSummaries.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.personSummaries.map((person) => (
                <div
                  key={person.id}
                  className="flex h-full flex-col justify-between rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-zinc-900">
                      <Link
                        href={`/history/${person.id}`}
                        className="text-blue-600 underline-offset-2 hover:underline"
                      >
                        {person.name}
                      </Link>
                    </h3>
                    <p className="text-sm text-zinc-600">
                      บันทึก {person.entryCount.toLocaleString("th-TH")} ครั้ง
                    </p>
                    <p className="text-sm font-medium text-zinc-900">
                      {currencyFormatter.format(person.totalAmount)}
                    </p>
                    {person.lastEntryAt ? (
                      <p className="text-xs text-zinc-500">
                        ล่าสุด {dateTimeFormatter.format(new Date(person.lastEntryAt))}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-500">ยังไม่มีประวัติ</p>
                    )}
                  </div>
                  <Link
                    href={`/history/${person.id}`}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                  >
                    ดูรายละเอียด
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
              ยังไม่มีข้อมูลสมาชิก เริ่มเพิ่มสมาชิกจากหน้าหลัก
            </p>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">ประวัติการบันทึกทั้งหมด</h2>
            <p className="text-sm text-zinc-600">เรียงตามเวลาจากใหม่ไปเก่า</p>
          </div>
          {data.entries.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">สมาชิก</th>
                    <th className="px-4 py-3">หมวดหมู่</th>
                    <th className="px-4 py-3">รายการ</th>
                    <th className="px-4 py-3 text-right">จำนวนเงิน</th>
                    <th className="px-4 py-3">บันทึกเมื่อ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data.entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3 font-medium text-zinc-800">
                        <Link
                          href={`/history/${entry.personId}`}
                          className="text-blue-600 underline-offset-2 hover:underline"
                        >
                          {entry.personName}
                        </Link>
                      </td>
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
              ยังไม่มีประวัติการออม
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

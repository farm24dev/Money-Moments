import Link from "next/link";
import { redirect } from "next/navigation";

import { AddPersonForm } from "@/app/components/AddPersonForm";
import { AddSavingEntryForm } from "@/app/components/AddSavingEntryForm";
import { DeletePersonButton } from "@/app/components/DeletePersonButton";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
});

type DashboardData = {
  people: Array<{
    id: number;
    name: string;
    totalAmount: number;
    entryCount: number;
  }>;
  entries: Array<{
    id: number;
    personId: number;
    personName: string;
    categoryName: string | null;
    label: string;
    amount: number;
    createdAt: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
  totalSaved: number;
};

async function getDashboardData(userId: string): Promise<DashboardData> {
  const [people, entries, categories] = await Promise.all([
    prisma.person.findMany({
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
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 25,
    }),
    await prisma.savingCategory.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
      },
    }),
  ]);

  const peopleWithTotals = people.map((person) => {
    const total = person.savingEntries.reduce(
      (acc, entry) => acc + Number(entry.amount),
      0,
    );

    return {
      id: person.id,
      name: person.name,
      totalAmount: total,
      entryCount: person._count.savingEntries,
    };
  });

  const totalSaved = peopleWithTotals.reduce(
    (acc, person) => acc + person.totalAmount,
    0,
  );

  const recentEntries = entries.map((entry) => ({
    id: entry.id,
    personId: entry.person.id,
    personName: entry.person.name,
    categoryName: entry.category?.name ?? null,
    label: entry.label,
    amount: Number(entry.amount),
    createdAt: entry.createdAt.toISOString(),
  }));

  return {
    people: peopleWithTotals,
    entries: recentEntries,
    categories,
    totalSaved,
  };
}

async function signOutAction() {
  "use server";

  await signOut();
  redirect("/login");
}

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = await getDashboardData(session.user.id);

  const topSaver = data.people
    .slice()
    .sort((a, b) => b.totalAmount - a.totalAmount)[0];

  const lastEntry = data.entries[0];

  return (
    <div className="min-h-screen bg-zinc-100 py-12 font-sans text-zinc-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold sm:text-4xl">
              ระบบบันทึกการออมเงิน
            </h1>
            <p className="max-w-2xl text-sm text-zinc-600 sm:text-base">
              บันทึกยอดออมเงินของแต่ละคน ตรวจสอบยอดรวม และดูประวัติการฝากล่าสุดได้จากหน้าเดียว
            </p>
            <nav className="flex flex-wrap gap-2 pt-2 text-xs sm:text-sm">
              <Link
                href="/history"
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-medium text-blue-700 transition hover:bg-blue-100"
              >
                ดูประวัติทั้งหมด
              </Link>
              <Link
                href="/categories"
                className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 font-medium text-purple-700 transition hover:bg-purple-100"
              >
                จัดการหมวดหมู่
              </Link>
            </nav>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="text-sm text-zinc-600">
              <p className="font-semibold text-zinc-800">
                {session.user.name ?? session.user.email}
              </p>
              {session.user.name ? (
                <p className="text-xs text-zinc-500">{session.user.email}</p>
              ) : null}
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-md border border-transparent bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
              >
                ออกจากระบบ
              </button>
            </form>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-blue-600">ยอดออมทั้งหมด</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {currencyFormatter.format(data.totalSaved)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-emerald-600">จำนวนสมาชิก</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {data.people.length} คน
            </p>
          </div>
          <div className="rounded-xl border border-purple-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-purple-600">สถิติเด่น</p>
            <p className="mt-2 text-sm text-zinc-700">
              {topSaver
                ? `${topSaver.name} สะสม ${currencyFormatter.format(topSaver.totalAmount)}`
                : "ยังไม่มีข้อมูล"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {lastEntry
                ? `บันทึกล่าสุดเมื่อ ${dateTimeFormatter.format(new Date(lastEntry.createdAt))}`
                : "ยังไม่มีการฝากเงิน"}
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <AddPersonForm />
          <AddSavingEntryForm
            people={data.people.map((person) => ({
              id: person.id,
              name: person.name,
            }))}
            categories={data.categories.map((category) => ({
              id: category.id,
              name: category.name,
              description: category.description,
            }))}
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">สมาชิกทั้งหมด</h2>
            <p className="text-sm text-zinc-600">
              กดชื่อเพื่อดูประวัติ หรือจัดการสมาชิกได้จากปุ่มลบ
            </p>
          </div>
          {data.people.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.people.map((person) => (
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
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <Link
                      href={`/history/${person.id}`}
                      className="inline-flex items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                    >
                      ดูประวัติ
                    </Link>
                    <DeletePersonButton
                      personId={person.id}
                      personName={person.name}
                      redirectTo=""
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
              ยังไม่มีสมาชิก เริ่มเพิ่มสมาชิกได้ด้านบน
            </p>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">รายการฝากล่าสุด</h2>
            <p className="text-sm text-zinc-600">
              แสดงข้อมูล 25 รายการล่าสุดตามเวลาที่บันทึก
            </p>
          </div>
          {data.entries.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      สมาชิก
                    </th>
                    <th scope="col" className="px-4 py-3">
                      หมวดหมู่
                    </th>
                    <th scope="col" className="px-4 py-3">
                      รายการ
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      จำนวนเงิน
                    </th>
                    <th scope="col" className="px-4 py-3">
                      บันทึกเมื่อ
                    </th>
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
              ยังไม่มีการบันทึกยอดออม เริ่มจากการเพิ่มสมาชิกและบันทึกยอดแรกได้เลย
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

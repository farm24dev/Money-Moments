import Link from "next/link";
import { redirect } from "next/navigation";

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
          select: { amount: true, type: true, transactionDate: true },
          orderBy: { transactionDate: "desc" },
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
        transactionDate: "desc",
      },
    }),
  ]);

  const personSummaries = people.map((person) => {
    const totalAmount = person.savingEntries.reduce(
      (sum, entry) => {
        const amount = Number(entry.amount);
        return entry.type === "withdraw" ? sum - amount : sum + amount;
      },
      0,
    );

    return {
      id: person.id,
      name: person.name,
      totalAmount,
      entryCount: person._count.savingEntries,
      lastEntryAt: person.savingEntries[0]?.transactionDate ?? null,
    };
  });

  const entryList = entries.map((entry) => ({
    id: entry.id,
    personId: entry.person.id,
    personName: entry.person.name,
    categoryName: entry.category?.name ?? null,
    label: entry.label,
    amount: Number(entry.amount),
    type: entry.type,
    transactionDate: entry.transactionDate,
    createdAt: entry.createdAt,
  }));

  const totalSaved = entryList.reduce((sum, entry) => {
    return entry.type === "withdraw" ? sum - entry.amount : sum + entry.amount;
  }, 0);

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
    <AppShell>
      <div className="space-y-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              ประวัติการออมทั้งหมด
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              ตรวจสอบประวัติการบันทึกยอดออมของทุกคน พร้อมเจาะลึกข้อมูลตามสมาชิกหรือหมวดหมู่
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge className="bg-primary/15 text-primary">
                ยอดรวม {currencyFormatter.format(data.totalSaved)}
              </Badge>
              <Badge className="bg-secondary text-secondary-foreground">
                จำนวนการบันทึก {data.entries.length.toLocaleString("th-TH")}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className={buttonClassName({ variant: "outline" })}
            >
              กลับหน้าหลัก
            </Link>
            <Link
              href="/categories"
              className={buttonClassName({ variant: "secondary" })}
            >
              จัดการหมวดหมู่
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ยอดออมรวมทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">
                {currencyFormatter.format(data.totalSaved)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                รวมทุกหมวดหมู่และทุกสมาชิกที่บันทึกไว้
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                จำนวนสมาชิกที่ติดตาม
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">
                {data.personSummaries.length}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                สมาชิกที่มีการบันทึกอย่างน้อยหนึ่งครั้ง
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                จำนวนการบันทึกทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">
                {data.entries.length.toLocaleString("th-TH")}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                ทุกประวัติย้อนหลังตั้งแต่เริ่มใช้งานระบบ
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">สรุปตามสมาชิก</h2>
            <p className="text-sm text-muted-foreground">กดที่ชื่อเพื่อดูรายละเอียดและจัดการข้อมูล</p>
          </div>
          {data.personSummaries.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.personSummaries.map((person) => (
                <Card key={person.id} className="border border-border/60 bg-card">
                  <CardContent className="space-y-3 p-4">
                    <div className="space-y-1">
                      <Link
                        href={`/history/${person.id}`}
                        className="text-lg font-semibold text-foreground underline-offset-4 hover:underline"
                      >
                        {person.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        บันทึก {person.entryCount.toLocaleString("th-TH")} ครั้ง
                      </p>
                    </div>
                    <p className="text-base font-medium text-foreground">
                      {currencyFormatter.format(person.totalAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {person.lastEntryAt
                        ? `บันทึกล่าสุด ${dateTimeFormatter.format(new Date(person.lastEntryAt))}`
                        : "ยังไม่มีประวัติ"}
                    </p>
                    <Link
                      href={`/history/${person.id}`}
                      className={buttonClassName({ variant: "outline", size: "sm", className: "w-full text-center" })}
                    >
                      ดูรายละเอียด
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              ยังไม่มีข้อมูลสมาชิก เริ่มเพิ่มสมาชิกจากหน้าหลัก
            </p>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">ประวัติการบันทึกทั้งหมด</h2>
            <p className="text-sm text-muted-foreground">เรียงตามเวลาจากใหม่ไปเก่า</p>
          </div>
          {data.entries.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border/60 text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">ประเภท</th>
                      <th className="px-4 py-3">สมาชิก</th>
                      <th className="px-4 py-3">หมวดหมู่</th>
                      <th className="px-4 py-3">รายการ</th>
                      <th className="px-4 py-3 text-right">จำนวนเงิน</th>
                      <th className="px-4 py-3">วันที่</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {data.entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              entry.type === "withdraw"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-emerald-500/15 text-emerald-700"
                            }
                          >
                            {entry.type === "withdraw" ? "เบิก" : "ฝาก"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          <Link
                            href={`/history/${entry.personId}`}
                            className="underline-offset-4 hover:underline"
                          >
                            {entry.personName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {entry.categoryName ? (
                            <Badge className="bg-accent text-accent-foreground">
                              {entry.categoryName}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{entry.label}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${entry.type === "withdraw" ? "text-destructive" : "text-foreground"}`}>
                          {entry.type === "withdraw" ? "-" : "+"}{currencyFormatter.format(entry.amount)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {dateTimeFormatter.format(new Date(entry.transactionDate))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              ยังไม่มีประวัติการออม
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}

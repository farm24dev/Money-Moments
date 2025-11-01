import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DeletePersonButton } from "@/app/components/DeletePersonButton";
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
        orderBy: { transactionDate: "desc" },
        select: {
          id: true,
          label: true,
          amount: true,
          type: true,
          transactionDate: true,
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
    (sum, entry) => {
      const amount = Number(entry.amount);
      return entry.type === "withdraw" ? sum - amount : sum + amount;
    },
    0,
  );

  const entries = person.savingEntries.map((entry) => ({
    id: entry.id,
    label: entry.label,
    categoryName: entry.category?.name ?? null,
    amount: Number(entry.amount),
    type: entry.type,
    transactionDate: entry.transactionDate,
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
    <AppShell>
      <div className="space-y-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              ประวัติของ {data.person.name}
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              เริ่มบันทึกตั้งแต่ {dateTimeFormatter.format(new Date(data.person.createdAt))}
            </p>
            <Badge className="bg-primary/15 text-primary">
              ยอดสะสม {currencyFormatter.format(data.totalAmount)}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/history"
              className={buttonClassName({ variant: "outline" })}
            >
              ดูประวัติทั้งหมด
            </Link>
            <Link
              href="/"
              className={buttonClassName({ variant: "secondary" })}
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ยอดออมทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">
                {currencyFormatter.format(data.totalAmount)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                รวมทุกการบันทึกของ {data.person.name}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                จำนวนครั้งที่บันทึก
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">
                {data.entries.length.toLocaleString("th-TH")}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                บันทึกล่าสุด{' '}
                {data.entries[0]
                  ? dateTimeFormatter.format(new Date(data.entries[0].transactionDate))
                  : "ยังไม่มีข้อมูล"}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-destructive">
                การจัดการ
              </CardTitle>
              <CardDescription>
                ลบสมาชิกนี้พร้อมข้อมูลทั้งหมด หากไม่ต้องการติดตามต่อ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeletePersonButton
                personId={data.person.id}
                personName={data.person.name}
                redirectTo="/history"
                className="w-full"
              />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">รายการบันทึก</h2>
            <p className="text-sm text-muted-foreground">เรียงตามเวลาจากใหม่ไปเก่า</p>
          </div>
          {data.entries.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border/60 text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">ประเภท</th>
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
              ยังไม่มีประวัติการออมสำหรับสมาชิกคนนี้
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { AddSavingEntryForm } from "@/app/components/AddSavingEntryForm";
import { DeletePersonButton } from "@/app/components/DeletePersonButton";
import { AppShell } from "@/components/layout/AppShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonClassName } from "@/lib/button-classes";
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
    type: string;
    transactionDate: string;
    createdAt: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    description: string | null;
    totalAmount: number;
    entryCount: number;
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
          select: { amount: true, type: true },
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
        transactionDate: "desc",
      },
      take: 25,
    }),
    prisma.savingCategory.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: {
        savingEntries: {
          select: { amount: true, type: true },
        },
        _count: {
          select: { savingEntries: true },
        },
      },
    }),
  ]);

  const peopleWithTotals = people.map((person) => {
    const total = person.savingEntries.reduce(
      (acc, entry) => {
        const amount = Number(entry.amount);
        return entry.type === "withdraw" ? acc - amount : acc + amount;
      },
      0,
    );

    return {
      id: person.id,
      name: person.name,
      totalAmount: total,
      entryCount: person._count.savingEntries,
    };
  });

  const categoriesWithTotals = categories.map((category) => {
    const total = category.savingEntries.reduce(
      (acc, entry) => {
        const amount = Number(entry.amount);
        return entry.type === "withdraw" ? acc - amount : acc + amount;
      },
      0,
    );

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      totalAmount: total,
      entryCount: category._count.savingEntries,
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
    type: entry.type,
    transactionDate: entry.transactionDate.toISOString(),
    createdAt: entry.createdAt.toISOString(),
  }));

  return {
    people: peopleWithTotals,
    entries: recentEntries,
    categories: categoriesWithTotals,
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
  const topCategories = data.categories
    .slice()
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 4);

  return (
    <AppShell>
      <div className="space-y-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              แดชบอร์ดการออม
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              ตรวจสอบยอดรวม สถานะการออมของทุกคน และจัดการหมวดหมู่ได้จากแผงควบคุมเดียว
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge className="bg-primary/15 text-primary">อัปเดตล่าสุด {lastEntry ? dateTimeFormatter.format(new Date(lastEntry.createdAt)) : "ยังไม่มีข้อมูล"}</Badge>
              <Badge className="bg-secondary text-secondary-foreground">
                หมวดหมู่ทั้งหมด {data.categories.length} รายการ
              </Badge>
            </div>
          </div>
          <form action={signOutAction} className="flex justify-end">
            <Button variant="outline">ออกจากระบบ</Button>
          </form>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                รวมทุกสมาชิกในระบบ
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                จำนวนสมาชิก
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">
                {data.people.length}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                สมาชิกที่กำลังติดตามการออม
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                หมวดหมู่ที่ใช้งาน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">
                {data.categories.filter((category) => category.entryCount > 0).length}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                มีประวัติการบันทึกแล้วอย่างน้อยหนึ่งครั้ง
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                สถิติเด่น
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-semibold text-foreground">
                {topSaver
                  ? `${topSaver.name} สะสม ${currencyFormatter.format(topSaver.totalAmount)}`
                  : "ยังไม่มีข้อมูล"}
              </p>
              <p className="text-xs text-muted-foreground">
                {lastEntry
                  ? `บันทึกล่าสุดเมื่อ ${dateTimeFormatter.format(new Date(lastEntry.createdAt))}`
                  : "ยังไม่มีการฝากเงิน"}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>เพิ่มสมาชิกใหม่</CardTitle>
              <CardDescription>
                กรอกชื่อสมาชิกที่ต้องการติดตามยอดออม ระบบจะเริ่มนับยอดตั้งแต่ครั้งแรกที่บันทึก
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                คลิกปุ่มด้านล่างเพื่อไปยังหน้าเพิ่มสมาชิกใหม่
              </p>
              <Link
                href="/people/add"
                className={buttonClassName({ variant: "default", className: "w-full text-center" })}
              >
                เพิ่มสมาชิกใหม่
              </Link>
            </CardContent>
          </Card>
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

        <section className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>สมาชิกทั้งหมด</CardTitle>
                <CardDescription>
                  ดูยอดรวมและจำนวนครั้งที่บันทึกของแต่ละคน กดเพื่อดูรายละเอียดเชิงลึก
                </CardDescription>
              </div>
              <Link
                href="/history"
                className={buttonClassName({ variant: "outline", size: "sm" })}
              >
                ดูประวัติรวม
              </Link>
            </CardHeader>
            <CardContent>
              {data.people.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.people.map((person) => (
                    <Card key={person.id} className="border border-border/60">
                      <CardContent className="space-y-3 p-4">
                        <div>
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
                        <p className="text-base font-medium">
                          {currencyFormatter.format(person.totalAmount)}
                        </p>
                        <div className="flex gap-2">
                          <Link
                            href={`/history/${person.id}`}
                            className={buttonClassName({
                              variant: "secondary",
                              size: "sm",
                              className: "flex-1 text-center",
                            })}
                          >
                            ดูประวัติ
                          </Link>
                          <DeletePersonButton
                            personId={person.id}
                            personName={person.name}
                            redirectTo=""
                            className="flex-1"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 rounded-md border border-dashed border-border/60 bg-muted/30 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    ยังไม่มีสมาชิก เริ่มเพิ่มสมาชิกใหม่เพื่อเริ่มบันทึกยอดออม
                  </p>
                  <Link
                    href="/people/add"
                    className={buttonClassName({ variant: "default", size: "sm" })}
                  >
                    เพิ่มสมาชิกแรก
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>หมวดหมู่ยอดนิยม</CardTitle>
              <CardDescription>
                สรุปยอดออมตามหมวดหมู่ เพื่อเห็นภาพรวมว่าเงินส่วนใหญ่ไปอยู่ที่ใด
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topCategories.length > 0 ? (
                <ul className="space-y-3 text-sm">
                  {topCategories.map((category) => (
                    <li
                      key={category.id}
                      className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-foreground">{category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          บันทึก {category.entryCount.toLocaleString("th-TH")} ครั้ง
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {currencyFormatter.format(category.totalAmount)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  ยังไม่มีหมวดหมู่ที่ใช้งาน เริ่มเพิ่มหมวดหมู่ใหม่เพื่อจัดระเบียบการออม
                </p>
              )}
              <Link
                href="/categories"
                className={buttonClassName({ variant: "outline", size: "sm", className: "w-full text-center" })}
              >
                จัดการหมวดหมู่
              </Link>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">รายการบันทึกล่าสุด</h2>
              <p className="text-sm text-muted-foreground">
                แสดงข้อมูล 25 รายการล่าสุด เรียงตามเวลาล่าสุดไปเก่าสุด
              </p>
            </div>
            <Link
              href="/history"
              className={buttonClassName({ variant: "secondary", size: "sm" })}
            >
              เปิดหน้าประวัติทั้งหมด
            </Link>
          </div>
          {data.entries.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border/60 text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        ประเภท
                      </th>
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
                        วันที่
                      </th>
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
              ยังไม่มีการบันทึกยอดออม เริ่มจากการเพิ่มสมาชิกและบันทึกยอดแรกได้เลย
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}

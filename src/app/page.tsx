import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AddPersonForm } from "@/app/components/AddPersonForm";
import { AddSavingEntryForm } from "@/app/components/AddSavingEntryForm";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FormState } from "@/types/form-state";

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
  }>;
  entries: Array<{
    id: number;
    personName: string;
    label: string;
    amount: number;
    createdAt: string;
  }>;
  totalSaved: number;
};

type PersonWithSavingEntries = {
  id: number;
  name: string;
  savingEntries: Array<{ amount: unknown }>;
};

type EntryWithPersonName = {
  id: number;
  label: string;
  amount: unknown;
  createdAt: Date;
  person: { name: string };
};

async function getDashboardData(userId: string): Promise<DashboardData> {
  const [people, entries]: [
    PersonWithSavingEntries[],
    EntryWithPersonName[],
  ] = await Promise.all([
    prisma.person.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: {
        savingEntries: {
          select: {
            amount: true,
          },
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
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 25,
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
    };
  });

  const totalSaved = peopleWithTotals.reduce(
    (acc, person) => acc + person.totalAmount,
    0,
  );

  const recentEntries = entries.map((entry) => ({
    id: entry.id,
    personName: entry.person.name,
    label: entry.label,
    amount: Number(entry.amount),
    createdAt: entry.createdAt.toISOString(),
  }));

  return {
    people: peopleWithTotals,
    entries: recentEntries,
    totalSaved,
  };
}

async function addPersonAction(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  "use server";

  const session = await auth();

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "จำเป็นต้องเข้าสู่ระบบก่อน",
    };
  }

  const name = formData.get("name")?.toString().trim() ?? "";

  if (!name) {
    return {
      status: "error",
      message: "กรุณาระบุชื่อสมาชิก",
    };
  }

  if (name.length > 64) {
    return {
      status: "error",
      message: "ชื่อต้องไม่เกิน 64 ตัวอักษร",
    };
  }

  try {
    await prisma.person.create({
      data: {
        name,
        userId: session.user.id,
      },
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        status: "error",
        message: "ชื่อสมาชิกนี้ถูกใช้งานแล้ว",
      };
    }

    console.error("Failed to add person", error);

    return {
      status: "error",
      message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
    };
  }

  revalidatePath("/");

  return {
    status: "success",
    message: `เพิ่ม ${name} เรียบร้อย`,
  };
}

async function addSavingEntryAction(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  "use server";

  const session = await auth();

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "จำเป็นต้องเข้าสู่ระบบก่อน",
    };
  }

  const personIdRaw = formData.get("personId")?.toString() ?? "";
  const label = formData.get("label")?.toString().trim() ?? "";
  const amountRaw = formData.get("amount")?.toString() ?? "";

  const personId = Number(personIdRaw);
  const amount = Number(amountRaw);

  if (!Number.isInteger(personId)) {
    return {
      status: "error",
      message: "กรุณาเลือกสมาชิก",
    };
  }

  if (!label) {
    return {
      status: "error",
      message: "กรุณาระบุรายการที่ต้องการเก็บ",
    };
  }

  if (label.length > 128) {
    return {
      status: "error",
      message: "รายการต้องไม่เกิน 128 ตัวอักษร",
    };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      status: "error",
      message: "จำนวนเงินต้องมากกว่า 0",
    };
  }

  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      userId: session.user.id,
    },
    select: { id: true },
  });

  if (!person) {
    return {
      status: "error",
      message: "ไม่พบสมาชิกที่เลือก",
    };
  }

  try {
    await prisma.savingEntry.create({
      data: {
        personId: person.id,
        label,
        amount,
      },
    });
  } catch (error) {
    console.error("Failed to add saving entry", error);

    return {
      status: "error",
      message: "ไม่สามารถบันทึกยอดออมได้ กรุณาลองใหม่",
    };
  }

  revalidatePath("/");

  return {
    status: "success",
    message: "บันทึกยอดออมเรียบร้อย",
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
          <AddPersonForm action={addPersonAction} />
          <AddSavingEntryForm
            action={addSavingEntryAction}
            people={data.people.map((person) => ({
              id: person.id,
              name: person.name,
            }))}
          />
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
                        {entry.personName}
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

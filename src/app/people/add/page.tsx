import Link from "next/link";
import { redirect } from "next/navigation";

import { AddPersonForm } from "@/app/components/AddPersonForm";
import { AppShell } from "@/components/layout/AppShell";
import { buttonClassName } from "@/lib/button-classes";
import { auth } from "@/lib/auth";

export default async function AddPersonPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    return (
        <AppShell>
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            เพิ่มสมาชิกใหม่
                        </h1>
                        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                            เพิ่มสมาชิกใหม่เข้าสู่ระบบเพื่อเริ่มติดตามยอดออมของพวกเขา
                        </p>
                    </div>
                    <Link
                        href="/"
                        className={buttonClassName({ variant: "outline" })}
                    >
                        กลับหน้าหลัก
                    </Link>
                </div>

                <div className="max-w-2xl">
                    <AddPersonForm />
                </div>
            </div>
        </AppShell>
    );
}

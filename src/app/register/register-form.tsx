"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { SubmitButton } from "@/app/components/SubmitButton";
import { FormState, initialFormState } from "@/types/form-state";

type RegisterFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
};

export function RegisterForm({ action }: RegisterFormProps) {
  const [state, formAction] = useFormState(action, initialFormState);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="text-sm font-medium text-zinc-700"
        >
          ชื่อที่แสดง
        </label>
        <input
          id="name"
          name="name"
          type="text"
          maxLength={64}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="ชื่อเล่นหรือชื่อเต็ม (ไม่บังคับ)"
        />
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-zinc-700"
        >
          อีเมล
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="your@email.com"
        />
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-zinc-700"
        >
          รหัสผ่าน
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="อย่างน้อย 6 ตัวอักษร"
        />
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor="confirm-password"
          className="text-sm font-medium text-zinc-700"
        >
          ยืนยันรหัสผ่าน
        </label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="พิมพ์รหัสผ่านอีกครั้ง"
        />
      </div>
      {state.status === "error" ? (
        <p className="text-sm text-red-600">{state.message}</p>
      ) : null}
      <SubmitButton className="w-full" pendingLabel="กำลังสมัครสมาชิก...">
        สร้างบัญชี
      </SubmitButton>
      <p className="text-center text-sm text-zinc-600">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}

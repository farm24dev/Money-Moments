"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { SubmitButton } from "@/app/components/SubmitButton";
import { FormState, initialFormState } from "@/types/form-state";

type LoginFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
};

export function LoginForm({ action }: LoginFormProps) {
  const [state, formAction] = useFormState(action, initialFormState);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
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
          autoComplete="current-password"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="••••••••"
        />
      </div>
      {state.status === "error" ? (
        <p className="text-sm text-red-600">{state.message}</p>
      ) : null}
      <SubmitButton className="w-full" pendingLabel="กำลังเข้าสู่ระบบ...">
        เข้าสู่ระบบ
      </SubmitButton>
      <p className="text-center text-sm text-zinc-600">
        ยังไม่มีบัญชี?{" "}
        <Link href="/register" className="font-medium text-blue-600 hover:underline">
          สมัครสมาชิก
        </Link>
      </p>
    </form>
  );
}

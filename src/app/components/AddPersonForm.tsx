"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";

import { initialFormState, FormState } from "@/types/form-state";

import { SubmitButton } from "./SubmitButton";

type AddPersonFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
};

export function AddPersonForm({ action }: AddPersonFormProps) {
  const [state, formAction] = useFormState(action, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">เพิ่มสมาชิก</h2>
        <p className="text-sm text-zinc-500">
          ระบุชื่อของคนที่ต้องการบันทึกเงินออม
        </p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="person-name" className="text-sm font-medium text-zinc-700">
          ชื่อสมาชิก
        </label>
        <input
          id="person-name"
          name="name"
          type="text"
          required
          maxLength={64}
          placeholder="เช่น แพรวา"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>
      {state.status === "error" ? (
        <p className="text-sm text-red-600">{state.message}</p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}
      <SubmitButton pendingLabel="กำลังเพิ่ม...">บันทึก</SubmitButton>
    </form>
  );
}

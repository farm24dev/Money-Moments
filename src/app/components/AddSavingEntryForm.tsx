"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";

import { initialFormState, FormState } from "@/types/form-state";

import { SubmitButton } from "./SubmitButton";

type PersonOption = {
  id: number;
  name: string;
};

type AddSavingEntryFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  people: PersonOption[];
};

export function AddSavingEntryForm({ action, people }: AddSavingEntryFormProps) {
  const [state, formAction] = useFormState(action, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  const hasPeople = people.length > 0;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <div>
        <h2 className="text-base font-semibold text-zinc-900">บันทึกยอดออม</h2>
        <p className="text-sm text-zinc-500">
          ระบุผู้ฝาก รายการที่เก็บเงิน และจำนวนเงินที่ฝากครั้งนี้
        </p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="saving-person" className="text-sm font-medium text-zinc-700">
          เลือกสมาชิก
        </label>
        <select
          id="saving-person"
          name="personId"
          required
          disabled={!hasPeople}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-zinc-100"
          defaultValue=""
        >
          <option value="" disabled>
            {hasPeople ? "เลือกสมาชิก" : "ยังไม่มีสมาชิก"}
          </option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="saving-label" className="text-sm font-medium text-zinc-700">
          รายการที่ต้องการเก็บ
        </label>
        <input
          id="saving-label"
          name="label"
          type="text"
          placeholder="เช่น ค่าเทอม, กองทุนเที่ยว"
          required
          maxLength={128}
          disabled={!hasPeople}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-zinc-100"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="saving-amount" className="text-sm font-medium text-zinc-700">
          จำนวนเงิน (บาท)
        </label>
        <input
          id="saving-amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          disabled={!hasPeople}
          placeholder="0.00"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-zinc-100"
        />
      </div>
      {!hasPeople ? (
        <p className="text-sm text-amber-600">
          กรุณาเพิ่มสมาชิกก่อนเพื่อบันทึกยอดออม
        </p>
      ) : null}
      {state.status === "error" ? (
        <p className="text-sm text-red-600">{state.message}</p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}
      <SubmitButton pendingLabel="กำลังบันทึก..." className="w-full">
        บันทึกยอดออม
      </SubmitButton>
    </form>
  );
}

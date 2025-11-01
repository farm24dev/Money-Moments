"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { initialFormState, FormState } from "@/types/form-state";

import { SubmitButton } from "./SubmitButton";

type PersonOption = {
  id: number;
  name: string;
};

type CategoryOption = {
  id: number;
  name: string;
  description: string | null;
};

type AddSavingEntryFormProps = {
  people: PersonOption[];
  categories: CategoryOption[];
};

type ApiResponse = {
  success: boolean;
  message?: string;
};

export function AddSavingEntryForm({ people, categories }: AddSavingEntryFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<FormState>(initialFormState);
  const [isPending, startTransition] = useTransition();

  const hasPeople = people.length > 0;

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  const categoriesMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id.toString(), category]));
  }, [categories]);

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!labelInputRef.current) {
      return;
    }

    if (labelInputRef.current.value.trim()) {
      return;
    }

    const selected = categoriesMap.get(event.target.value);
    if (selected) {
      labelInputRef.current.value = selected.name;
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasPeople) {
      setState({ status: "error", message: "กรุณาเพิ่มสมาชิกก่อน" });
      return;
    }

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const personIdValue = formData.get("personId")?.toString();
    const label = formData.get("label")?.toString().trim() ?? "";
    const amountValue = formData.get("amount")?.toString() ?? "";
    const categoryIdValue = formData.get("categoryId")?.toString() ?? "";

    if (!personIdValue) {
      setState({ status: "error", message: "กรุณาเลือกสมาชิก" });
      return;
    }

    if (!label) {
      setState({ status: "error", message: "กรุณาระบุรายการที่ต้องการเก็บ" });
      return;
    }

    if (label.length > 128) {
      setState({ status: "error", message: "รายการต้องไม่เกิน 128 ตัวอักษร" });
      return;
    }

    const amountNumber = Number(amountValue);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setState({ status: "error", message: "จำนวนเงินต้องมากกว่า 0" });
      return;
    }

    const requestBody = {
      personId: Number(personIdValue),
      label,
      amount: amountValue,
      categoryId: categoryIdValue ? Number(categoryIdValue) : null,
    };

    const run = async () => {
      setState(initialFormState);

      try {
        const response = await fetch("/api/saving-entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const payload = (await response
          .json()
          .catch(() => null)) as ApiResponse | null;

        if (!response.ok || !payload?.success) {
          setState({
            status: "error",
            message: payload?.message ?? "ไม่สามารถบันทึกยอดออมได้ กรุณาลองใหม่",
          });
          return;
        }

        setState({
          status: "success",
          message: payload?.message ?? "บันทึกยอดออมเรียบร้อย",
        });
        router.refresh();
      } catch (error) {
        console.error("Failed to submit saving entry form", error);
        setState({
          status: "error",
          message: "ไม่สามารถบันทึกยอดออมได้ กรุณาลองใหม่",
        });
      }
    };

    startTransition(() => {
      void run();
    });
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <div>
        <h2 className="text-base font-semibold text-zinc-900">บันทึกยอดออม</h2>
        <p className="text-sm text-zinc-500">
          ระบุผู้ฝาก เลือกหมวดหมู่ (ถ้าต้องการ) และจำนวนเงินที่ฝากครั้งนี้
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
        <label htmlFor="saving-category" className="text-sm font-medium text-zinc-700">
          หมวดหมู่ (ไม่บังคับ)
        </label>
        <select
          id="saving-category"
          name="categoryId"
          disabled={!hasPeople || categories.length === 0}
          onChange={handleCategoryChange}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-zinc-100"
          defaultValue=""
        >
          <option value="">
            {categories.length > 0 ? "เลือกหมวดหมู่" : "ยังไม่มีหมวดหมู่"}
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
              {category.description ? ` - ${category.description}` : ""}
            </option>
          ))}
        </select>
        {categories.length === 0 ? (
          <p className="text-xs text-zinc-500">
            สามารถเพิ่มหมวดหมู่ได้ที่หน้าจัดการหมวดหมู่
          </p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="saving-label" className="text-sm font-medium text-zinc-700">
          รายการที่ต้องการเก็บ
        </label>
        <input
          ref={labelInputRef}
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
      <SubmitButton pendingLabel="กำลังบันทึก..." className="w-full" isPending={isPending}>
        บันทึกยอดออม
      </SubmitButton>
    </form>
  );
}

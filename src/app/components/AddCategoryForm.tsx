"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { initialFormState, FormState } from "@/types/form-state";

import { SubmitButton } from "./SubmitButton";

type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
};

type CreatedCategory = {
  id: number;
  name: string;
};

export function AddCategoryForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<FormState>(initialFormState);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const name = formData.get("name")?.toString().trim() ?? "";
    const description = formData.get("description")?.toString().trim() ?? "";

    if (!name) {
      setState({ status: "error", message: "กรุณาระบุชื่อหมวดหมู่" });
      return;
    }

    if (name.length > 64) {
      setState({ status: "error", message: "ชื่อหมวดหมู่ต้องไม่เกิน 64 ตัวอักษร" });
      return;
    }

    if (description.length > 256) {
      setState({ status: "error", message: "คำอธิบายต้องไม่เกิน 256 ตัวอักษร" });
      return;
    }

    const run = async () => {
      setState(initialFormState);

      try {
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description: description.length > 0 ? description : undefined,
          }),
        });

        const payload = (await response
          .json()
          .catch(() => null)) as ApiResponse<CreatedCategory> | null;

        if (!response.ok || !payload?.success) {
          setState({
            status: "error",
            message: payload?.message ?? "ไม่สามารถบันทึกหมวดหมู่ได้ กรุณาลองใหม่",
          });
          return;
        }

        setState({
          status: "success",
          message:
            payload.message ?? `เพิ่มหมวดหมู่ ${payload.data?.name ?? "ใหม่"} เรียบร้อย`,
        });
        router.refresh();
      } catch (error) {
        console.error("Failed to create category", error);
        setState({
          status: "error",
          message: "ไม่สามารถบันทึกหมวดหมู่ได้ กรุณาลองใหม่",
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
        <h2 className="text-base font-semibold text-zinc-900">เพิ่มหมวดหมู่การออม</h2>
        <p className="text-sm text-zinc-500">
          กำหนดหมวดหมู่เพื่อเลือกใช้ตอนบันทึกยอดออม
        </p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="category-name" className="text-sm font-medium text-zinc-700">
          ชื่อหมวดหมู่
        </label>
        <input
          id="category-name"
          name="name"
          type="text"
          required
          maxLength={64}
          placeholder="เช่น กองทุนการศึกษา"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="category-description" className="text-sm font-medium text-zinc-700">
          คำอธิบาย (ไม่บังคับ)
        </label>
        <textarea
          id="category-description"
          name="description"
          maxLength={256}
          rows={3}
          placeholder="รายละเอียดเพิ่มเติมหรือเป้าหมายของหมวดหมู่นี้"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>
      {state.status === "error" ? (
        <p className="text-sm text-red-600">{state.message}</p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}
      <SubmitButton pendingLabel="กำลังเพิ่ม..." isPending={isPending}>
        บันทึกหมวดหมู่
      </SubmitButton>
    </form>
  );
}

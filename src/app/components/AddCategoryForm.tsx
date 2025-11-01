"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/app/components/SubmitButton";
import { initialFormState, FormState } from "@/types/form-state";

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
          message: payload.message ?? `เพิ่มหมวดหมู่ ${payload.data?.name ?? "ใหม่"} เรียบร้อย`,
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
    <Card>
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <CardHeader className="pb-2">
          <CardTitle>เพิ่มหมวดหมู่การออม</CardTitle>
          <CardDescription>
            แบ่งหมวดหมู่เพื่อวิเคราะห์รูปแบบการออม และเลือกใช้สะดวกในแบบฟอร์มบันทึกยอด
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name" requiredIndicator>
              ชื่อหมวดหมู่
            </Label>
            <Input
              id="category-name"
              name="name"
              placeholder="เช่น กองทุนการศึกษา"
              maxLength={64}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-description">คำอธิบาย (ไม่บังคับ)</Label>
            <Textarea
              id="category-description"
              name="description"
              maxLength={256}
              rows={3}
              placeholder="รายละเอียดเพิ่มเติมหรือเป้าหมายของหมวดหมู่นี้"
            />
          </div>
          {state.status === "error" ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}
          {state.status === "success" && state.message ? (
            <p className="text-sm text-emerald-600">{state.message}</p>
          ) : null}
        </CardContent>
        <div className="px-6 pb-6">
          <SubmitButton pendingLabel="กำลังเพิ่ม..." isPending={isPending} className="w-full">
            บันทึกหมวดหมู่
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}

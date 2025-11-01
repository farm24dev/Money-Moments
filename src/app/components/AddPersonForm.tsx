"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/app/components/SubmitButton";
import { initialFormState, FormState } from "@/types/form-state";

type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
};

type CreatedPerson = {
  id: number;
  name: string;
};

export function AddPersonForm() {
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

    if (!name) {
      setState({ status: "error", message: "กรุณาระบุชื่อสมาชิก" });
      return;
    }

    if (name.length > 64) {
      setState({ status: "error", message: "ชื่อต้องไม่เกิน 64 ตัวอักษร" });
      return;
    }

    const run = async () => {
      setState(initialFormState);

      try {
        const response = await fetch("/api/people", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        });

        const payload = (await response
          .json()
          .catch(() => null)) as ApiResponse<CreatedPerson> | null;

        if (!response.ok || !payload?.success) {
          setState({
            status: "error",
            message: payload?.message ?? "ไม่สามารถเพิ่มสมาชิกได้ กรุณาลองอีกครั้ง",
          });
          return;
        }

        setState({
          status: "success",
          message: payload.message ?? `เพิ่ม ${payload.data?.name ?? "สมาชิก"} เรียบร้อย`,
        });

        // Redirect to home page after 1 second
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } catch (error) {
        console.error("Failed to submit add person form", error);
        setState({
          status: "error",
          message: "ไม่สามารถเพิ่มสมาชิกได้ กรุณาลองอีกครั้ง",
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
          <CardTitle>เพิ่มสมาชิกใหม่</CardTitle>
          <CardDescription>
            กรอกชื่อสมาชิกที่ต้องการติดตามยอดออม ระบบจะเริ่มนับยอดตั้งแต่ครั้งแรกที่บันทึก
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="person-name" requiredIndicator>
              ชื่อสมาชิก
            </Label>
            <Input
              id="person-name"
              name="name"
              placeholder="เช่น แพรวา"
              autoComplete="off"
              maxLength={64}
              required
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
            บันทึกสมาชิก
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}

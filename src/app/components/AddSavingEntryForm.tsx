"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/app/components/SubmitButton";
import { initialFormState, FormState } from "@/types/form-state";

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
    const type = formData.get("type")?.toString() ?? "deposit";
    const transactionDate = formData.get("transactionDate")?.toString() ?? "";

    if (!personIdValue) {
      setState({ status: "error", message: "กรุณาเลือกสมาชิก" });
      return;
    }

    if (!transactionDate) {
      setState({ status: "error", message: "กรุณาเลือกวันที่ทำรายการ" });
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
      type,
      transactionDate,
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
    <Card>
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <CardHeader className="pb-2">
          <CardTitle>บันทึกยอดออม</CardTitle>
          <CardDescription>
            ระบุรายละเอียดการฝากหรือเบิก เลือกหมวดหมู่เพื่อช่วยจัดกลุ่มแผนการออมของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="saving-type" requiredIndicator>
                ประเภท
              </Label>
              <Select
                id="saving-type"
                name="type"
                required
                disabled={!hasPeople}
                defaultValue="deposit"
              >
                <option value="deposit">ฝาก</option>
                <option value="withdraw">เบิก</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="saving-date" requiredIndicator>
                วันที่ทำรายการ
              </Label>
              <Input
                id="saving-date"
                name="transactionDate"
                type="date"
                required
                disabled={!hasPeople}
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="saving-person" requiredIndicator>
                เลือกสมาชิก
              </Label>
              <Select
                id="saving-person"
                name="personId"
                required
                disabled={!hasPeople}
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
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="saving-category">หมวดหมู่ (ไม่บังคับ)</Label>
              <Select
                id="saving-category"
                name="categoryId"
                disabled={!hasPeople || categories.length === 0}
                defaultValue=""
                onChange={handleCategoryChange}
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
              </Select>
              {categories.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  เพิ่มหมวดหมู่ใหม่ได้ที่เมนูหมวดหมู่ด้านซ้ายมือ
                </p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="saving-label" requiredIndicator>
              รายการที่ต้องการเก็บ
            </Label>
            <Input
              ref={labelInputRef}
              id="saving-label"
              name="label"
              placeholder="เช่น ค่าเทอม, ทริปเที่ยว"
              maxLength={128}
              required
              disabled={!hasPeople}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="saving-amount" requiredIndicator>
              จำนวนเงิน (บาท)
            </Label>
            <Input
              id="saving-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
              disabled={!hasPeople}
            />
          </div>
          {!hasPeople ? (
            <p className="text-sm text-amber-600">
              กรุณาเพิ่มสมาชิกก่อนเพื่อบันทึกยอดออม
            </p>
          ) : null}
          {state.status === "error" ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}
          {state.status === "success" && state.message ? (
            <p className="text-sm text-emerald-600">{state.message}</p>
          ) : null}
        </CardContent>
        <div className="px-6 pb-6">
          <SubmitButton
            pendingLabel="กำลังบันทึก..."
            className="w-full"
            isPending={isPending}
          >
            บันทึกยอดออม
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}

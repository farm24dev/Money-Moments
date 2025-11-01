"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

type DeletePersonButtonProps = {
  personId: number;
  personName: string;
  redirectTo?: string;
  className?: string;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  requiresConfirmation?: boolean;
};

export function DeletePersonButton({
  personId,
  personName,
  redirectTo = "/",
  className,
}: DeletePersonButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pendingForceDelete, setPendingForceDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmationMessage = pendingForceDelete
      ? warning ??
        `สมาชิกคนนี้มีประวัติการออมอยู่ ลบแล้วข้อมูลทั้งหมดจะหาย ต้องการลบ ${personName} หรือไม่?`
      : `ต้องการลบ ${personName} หรือไม่? ข้อมูลการออมทั้งหมดของสมาชิกคนนี้จะถูกลบด้วย`;

    const confirmed = window.confirm(confirmationMessage);

    if (!confirmed) {
      return;
    }

    const run = async () => {
      setError(null);
      try {
        const url = pendingForceDelete
          ? `/api/people/${personId}?force=true`
          : `/api/people/${personId}`;
        const response = await fetch(url, { method: "DELETE" });

        const payload = (await response.json().catch(() => null)) as ApiResponse | null;

        if (!response.ok || !payload?.success) {
          if (payload?.requiresConfirmation) {
            setWarning(payload.message ?? "สมาชิกคนนี้มีประวัติการออมอยู่ ต้องการลบหรือไม่?");
            setPendingForceDelete(true);
            return;
          }

          setError(payload?.message ?? "ไม่สามารถลบสมาชิกได้ กรุณาลองใหม่");
          return;
        }

        if (redirectTo) {
          router.push(redirectTo);
        }

        router.refresh();
        setPendingForceDelete(false);
        setWarning(null);
      } catch (error) {
        console.error("Failed to delete person", error);
        setError("ไม่สามารถลบสมาชิกได้ กรุณาลองใหม่");
      }
    };

    startTransition(() => {
      void run();
    });
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="destructive"
        className={className}
        onClick={handleDelete}
        isLoading={isPending}
      >
        ลบสมาชิก
      </Button>
      {warning ? <p className="text-xs text-amber-600">{warning}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type DeletePersonButtonProps = {
  personId: number;
  personName: string;
  redirectTo?: string;
  className?: string;
};

type ApiResponse = {
  success: boolean;
  message?: string;
};

export function DeletePersonButton({
  personId,
  personName,
  redirectTo = "/",
  className = "",
}: DeletePersonButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pendingForceDelete, setPendingForceDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmationMessage = pendingForceDelete
      ? warning ??
        `สมาชิกคนนี้มีประวัติการออมอยู่ ลบแล้วข้อมูลทั้งหมดจะถูกลบ ต้องการลบ ${personName} หรือไม่?`
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
        const response = await fetch(url, {
          method: "DELETE",
        });

        const payload = (await response.json().catch(() => null)) as
          | (ApiResponse & { requiresConfirmation?: boolean })
          | null;

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
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className={`w-full rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {isPending ? "กำลังลบ..." : "ลบสมาชิก"}
      </button>
      {warning ? <p className="text-xs text-amber-600">{warning}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

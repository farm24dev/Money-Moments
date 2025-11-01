"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

type DeleteCategoryButtonProps = {
    categoryId: number;
    categoryName: string;
    hasEntries: boolean;
    className?: string;
};

type ApiResponse = {
    success: boolean;
    message?: string;
    requiresConfirmation?: boolean;
};

export function DeleteCategoryButton({
    categoryId,
    categoryName,
    hasEntries,
    className,
}: DeleteCategoryButtonProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);
    const [pendingForceDelete, setPendingForceDelete] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        const confirmationMessage = pendingForceDelete
            ? warning ??
            `หมวดหมู่นี้มีประวัติการบันทึกอยู่ ลบแล้วรายการจะไม่มีหมวดหมู่ ต้องการลบ ${categoryName} หรือไม่?`
            : hasEntries
                ? `หมวดหมู่ ${categoryName} มีประวัติการบันทึกอยู่ ต้องการลบหรือไม่? (รายการจะไม่ถูกลบแต่จะไม่มีหมวดหมู่)`
                : `ต้องการลบหมวดหมู่ ${categoryName} หรือไม่?`;

        const confirmed = window.confirm(confirmationMessage);

        if (!confirmed) {
            return;
        }

        const run = async () => {
            setError(null);
            try {
                const url = pendingForceDelete
                    ? `/api/categories/${categoryId}?force=true`
                    : `/api/categories/${categoryId}`;
                const response = await fetch(url, { method: "DELETE" });

                const payload = (await response.json().catch(() => null)) as ApiResponse | null;

                if (!response.ok || !payload?.success) {
                    if (payload?.requiresConfirmation) {
                        setWarning(payload.message ?? "หมวดหมู่นี้มีประวัติการบันทึกอยู่ ต้องการลบหรือไม่?");
                        setPendingForceDelete(true);
                        return;
                    }

                    setError(payload?.message ?? "ไม่สามารถลบหมวดหมู่ได้ กรุณาลองใหม่");
                    return;
                }

                router.refresh();
                setPendingForceDelete(false);
                setWarning(null);
            } catch (error) {
                console.error("Failed to delete category", error);
                setError("ไม่สามารถลบหมวดหมู่ได้ กรุณาลองใหม่");
            }
        };

        startTransition(() => {
            void run();
        });
    };

    return (
        <div className="space-y-1">
            <Button
                type="button"
                variant="destructive"
                size="sm"
                className={className}
                onClick={handleDelete}
                isLoading={isPending}
            >
                ลบ
            </Button>
            {warning ? <p className="text-xs text-amber-600">{warning}</p> : null}
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
    );
}

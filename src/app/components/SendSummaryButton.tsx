"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

type SendSummaryButtonProps = {
    personId: number;
    personName: string;
    className?: string;
};

export function SendSummaryButton({
    personId,
    personName,
    className,
}: SendSummaryButtonProps) {
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
        null
    );
    const [isPending, startTransition] = useTransition();

    const handleSendSummary = () => {
        setMessage(null);

        const run = async () => {
            try {
                const response = await fetch(`/api/people/${personId}/send-summary`, {
                    method: "POST",
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    setMessage({
                        type: "error",
                        text: data.message || "ไม่สามารถส่งสรุปได้",
                    });
                    return;
                }

                setMessage({
                    type: "success",
                    text: `ส่งสรุปของ ${personName} ไปยัง LINE แล้ว`,
                });

                // Clear message after 3 seconds
                setTimeout(() => setMessage(null), 3000);
            } catch (error) {
                console.error("Failed to send summary:", error);
                setMessage({
                    type: "error",
                    text: "เกิดข้อผิดพลาดในการส่งสรุป",
                });
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
                variant="secondary"
                className={className}
                onClick={handleSendSummary}
                isLoading={isPending}
            >
                📊 ส่งสรุปไปยัง LINE
            </Button>
            {message ? (
                <p
                    className={`text-xs ${message.type === "success" ? "text-emerald-600" : "text-destructive"
                        }`}
                >
                    {message.text}
                </p>
            ) : null}
        </div>
    );
}

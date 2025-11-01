"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  isPending?: boolean;
  variant?: React.ComponentProps<typeof Button>["variant"];
};

export function SubmitButton({
  children,
  pendingLabel = "กำลังบันทึก...",
  className,
  isPending,
  variant = "default",
}: SubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const pending = isPending ?? formPending;

  return (
    <Button
      type="submit"
      className={className}
      isLoading={pending}
      variant={variant}
      disabled={pending}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}

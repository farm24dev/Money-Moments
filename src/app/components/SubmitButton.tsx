"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  isPending?: boolean;
};

export function SubmitButton({
  children,
  pendingLabel = "กำลังบันทึก...",
  className = "",
  isPending,
}: SubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const pending = isPending ?? formPending;

  return (
    <button
      type="submit"
      className={`rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      disabled={pending}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

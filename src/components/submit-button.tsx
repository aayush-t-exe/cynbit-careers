"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function SubmitButton({ children, pendingText, className }: { children: React.ReactNode; pendingText: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" size={16} aria-hidden /> {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

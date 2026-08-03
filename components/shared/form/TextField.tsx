import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export const TextField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function TextField({ invalid, className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${inputClass}${invalid ? " border-danger" : ""} ${className}`}
      {...props}
    />
  );
});

TextField.displayName = "TextField";

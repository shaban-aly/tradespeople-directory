import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

const textAreaClass =
  "w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function TextArea({ invalid, className = "", ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${textAreaClass}${invalid ? " border-danger" : ""} ${className}`}
      {...props}
    />
  );
});

TextArea.displayName = "TextArea";

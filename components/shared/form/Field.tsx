import type { ReactNode } from "react";

export function fieldErrorId(htmlFor: string): string {
  return `${htmlFor}-error`;
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-base font-bold">
        {label}
        {required && <span className="text-danger"> *</span>}
        {hint && <span className="font-normal text-muted"> {hint}</span>}
      </label>
      {children}
      {error && (
        <p
          id={fieldErrorId(htmlFor)}
          role="alert"
          className="mt-1.5 text-base font-bold text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}

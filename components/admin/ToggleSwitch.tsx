export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex h-6 w-11 shrink-0 items-center rounded-full border border-border px-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        checked ? "justify-end bg-action" : "justify-start bg-border"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span className="h-5 w-5 rounded-full bg-white shadow" />
    </button>
  );
}

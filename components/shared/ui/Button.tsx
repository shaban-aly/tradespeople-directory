import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import Link from "next/link";

export type ButtonVariant =
  | "primary"
  | "action"
  | "outline"
  | "ghost"
  | "onAccent"
  | "onAccentGhost";

export type ButtonSize = "icon" | "sm" | "md" | "lg";

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent/90",
  action: "bg-action text-on-action hover:bg-action/90",
  outline:
    "border-2 border-accent text-accent hover:bg-accent hover:text-on-accent",
  ghost:
    "border border-border bg-card text-foreground hover:border-accent hover:text-accent",
  onAccent: "bg-on-accent text-accent hover:bg-on-accent/90",
  onAccentGhost:
    "border-2 border-on-accent text-on-accent hover:bg-on-accent/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  icon: "h-12 w-12 p-0",
  sm: "min-h-12 px-3 text-base",
  md: "min-h-12 px-4 text-base",
  lg: "min-h-14 px-5 text-lg",
};

export function buttonClasses(
  variant: ButtonVariant,
  size: ButtonSize = "md",
): string {
  return `${baseClass} ${variantClasses[variant]} ${sizeClasses[size]}`;
}

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

type ButtonNativeProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonProps>;

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps & ButtonNativeProps) {
  return (
    <button className={`${buttonClasses(variant, size)} ${className}`} {...props}>
      {children}
    </button>
  );
}

type ButtonLinkProps = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonLinkProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonLinkProps>) {
  return (
    <Link href={href} className={`${buttonClasses(variant, size)} ${className}`} {...props}>
      {children}
    </Link>
  );
}

type ButtonAnchorProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof ButtonProps
> &
  ButtonProps;

export function ButtonAnchor({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonAnchorProps) {
  return (
    <a className={`${buttonClasses(variant, size)} ${className}`} {...props}>
      {children}
    </a>
  );
}

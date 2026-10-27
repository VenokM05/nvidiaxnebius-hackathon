import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "ghost" | "outline";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium text-sm transition-[var(--transition-smooth)] focus-ring disabled:opacity-45 disabled:pointer-events-none";
  const styles: Record<ButtonVariant, string> = {
    primary:
      "bg-primary text-black hover:bg-primary-bright active:scale-[0.98] shadow-[0_8px_24px_-10px_hsl(var(--primary)/0.6)]",
    ghost: "text-fg-muted hover:text-fg hover:bg-surface-2",
    outline:
      "border border-line text-fg hover:border-line-strong hover:bg-surface-2",
  };
  return (
    <button
      className={`${base} px-4 py-2.5 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`panel ${className}`}>{children}</div>;
}

export function Pill({
  children,
  className = "",
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11px] font-medium tracking-wide text-fg-muted ${className}`}
    >
      {children}
    </span>
  );
}

export function Spinner() {
  return (
    <span
      className="inline-block size-4 animate-[var(--animate-spin-slow)] rounded-full border-2 border-line-strong border-t-primary"
      role="status"
      aria-label="Loading"
    />
  );
}

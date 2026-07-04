import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    "inline-flex items-center justify-center rounded-full font-display font-semibold text-sm tracking-wide px-6 py-3 transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<Variant, string> = {
    primary:
      "bg-[image:var(--ember-grad)] text-[#1A0A08] shadow-[0_6px_20px_-6px_rgba(255,92,57,0.55)] hover:brightness-110",
    ghost: "text-ink-dim hover:text-ink border border-line",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
}

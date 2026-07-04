import { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-[14px] border border-line bg-pane px-4 py-3 text-ink placeholder:text-ink-faint outline-none focus:border-ember-2 ${className}`}
      {...props}
    />
  );
}

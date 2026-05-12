import { InputHTMLAttributes, ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
}

export const Field = forwardRef<HTMLInputElement, Props>(
  ({ label, error, icon, suffix, className, id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <label className="block space-y-1.5" htmlFor={inputId}>
        {label && (
          <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-text-muted font-mono">
            {label}
          </span>
        )}
        <div
          className={cn(
            "flex items-center gap-2 rounded-[10px] border border-border bg-surface px-3 py-2.5 transition focus-within:border-text focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.04)]",
            error && "border-red-500 focus-within:border-red-500"
          )}
        >
          {icon && <span className="text-text-muted">{icon}</span>}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "min-w-0 flex-1 bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none",
              className
            )}
            {...rest}
          />
          {suffix}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </label>
    );
  }
);
Field.displayName = "Field";

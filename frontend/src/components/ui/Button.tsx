import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-dark disabled:bg-gray-300 dark:disabled:bg-gray-700",
  secondary:
    "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
  ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", loading, disabled, children, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      disabled={loading || disabled}
      {...rest}
    >
      {loading ? "..." : children}
    </button>
  )
);
Button.displayName = "Button";

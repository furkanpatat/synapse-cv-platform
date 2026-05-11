import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
          {...rest}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

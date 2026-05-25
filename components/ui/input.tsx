import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-base text-foreground",
        "placeholder:text-subtle",
        "focus-visible:outline-none focus-visible:border-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn("text-xs font-medium uppercase tracking-wider text-muted", className)}
    {...props}
  />
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-11 w-full appearance-none rounded-lg border border-border-strong bg-background px-3 py-2 text-base text-foreground",
        "focus-visible:outline-none focus-visible:border-accent",
        "bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%270%200%2020%2020%27%20fill=%27%23a1a1aa%27%20xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath%20d=%27M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[length:1.25rem] bg-[right_0.5rem_center] pr-9",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

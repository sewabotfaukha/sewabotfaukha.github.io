import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "gradient" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aitech-to";

const variantStyles: Record<ButtonVariant, string> = {
  gradient:
    "bg-gradient-aitech text-white shadow-lg shadow-aitech-from/20 hover:shadow-xl hover:shadow-aitech-to/40 hover:-translate-y-0.5 active:translate-y-0",
  outline:
    "border border-border text-foreground hover:border-aitech-to/60 hover:bg-background-surface hover:-translate-y-0.5 active:translate-y-0",
};

/**
 * Helper untuk mengambil className tombol Faukha tanpa elemen <button>-nya.
 * Dipakai saat CTA perlu jadi link (<a>) — supaya tidak nested <a><button/></a>.
 */
export function getButtonClasses(variant: ButtonVariant = "gradient", className?: string) {
  return cn(baseStyles, variantStyles[variant], className);
}

export function Button({
  variant = "gradient",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={getButtonClasses(variant, className)} {...props}>
      {children}
    </button>
  );
}

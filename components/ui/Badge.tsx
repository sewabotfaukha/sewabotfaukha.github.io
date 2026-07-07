import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-background-surface/80 px-4 py-1.5 text-xs font-medium text-foreground-muted backdrop-blur-sm",
        className
      )}
    >
      {children}
    </span>
  );
}

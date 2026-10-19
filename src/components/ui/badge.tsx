import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap", {
  variants: {
    variant: {
      default: "bg-brand-tint text-brand-strong",
      outline: "border border-line text-ink-2 bg-white",
      good: "bg-good-tint text-good",
      warn: "bg-warn-tint text-warn",
      bad: "bg-bad-tint text-bad",
      ink: "bg-ink text-white",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

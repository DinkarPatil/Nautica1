import { cn } from "./cn";

export function LiveDot({ className }: { className?: string }) {
  return <span aria-hidden className={cn("vg-livedot", className)} />;
}

import { cn } from "./cn";

export function Skeleton({
  className,
  variant = "line",
}: {
  className?: string;
  variant?: "line" | "block" | "circle";
}) {
  const shape =
    variant === "circle" ? "rounded-full" : variant === "block" ? "rounded-md" : "rounded-sm";
  return <div className={cn("vg-shimmer", shape, className)} />;
}

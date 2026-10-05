import type { ReactNode } from "react";
import { cn } from "../primitives";

export function ReportSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("py-8 border-t border-voyage-border-2 first:border-0", className)}>
      <h2 className="vg-label mb-4">{title}</h2>
      {children}
    </section>
  );
}

import type { ReactNode } from "react";
import { cn } from "./cn";

export function EmptyState({
  title,
  body,
  cta,
  className,
}: {
  title: string;
  body?: string;
  cta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-center py-10 px-6", className)}>
      <p className="text-[13px] text-voyage-text">{title}</p>
      {body && <p className="text-[12px] text-voyage-text-3 mt-1.5 max-w-xs mx-auto">{body}</p>}
      {cta && <div className="mt-4 flex justify-center">{cta}</div>}
    </div>
  );
}

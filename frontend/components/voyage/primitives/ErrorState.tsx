import type { ReactNode } from "react";
import { cn } from "./cn";

export function ErrorState({
  title = "Something went wrong",
  body,
  retry,
  className,
}: {
  title?: string;
  body?: string;
  retry?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-center py-8 px-6", className)}>
      <p className="text-[13px] text-voyage-danger">{title}</p>
      {body && <p className="text-[12px] text-voyage-text-3 mt-1.5 max-w-xs mx-auto">{body}</p>}
      {retry && <div className="mt-4 flex justify-center">{retry}</div>}
    </div>
  );
}

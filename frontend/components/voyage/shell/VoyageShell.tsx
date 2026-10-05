import type { ReactNode } from "react";
import { cn } from "../primitives";

export function VoyageShell({
  topBar,
  statusBar,
  children,
  className,
}: {
  topBar?: ReactNode;
  statusBar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen flex flex-col", className)}>
      {topBar}
      <main className="flex-1 pb-12">{children}</main>
      {statusBar}
    </div>
  );
}

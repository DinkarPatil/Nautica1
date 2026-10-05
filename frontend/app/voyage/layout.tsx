import type { ReactNode } from "react";

export default function VoyageRootLayout({ children }: { children: ReactNode }) {
  return (
    <div data-surface="voyage" className="min-h-screen w-full bg-voyage-bg text-voyage-text">
      {children}
    </div>
  );
}

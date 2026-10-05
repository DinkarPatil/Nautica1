"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, Info, X } from "lucide-react";

export type ToastVariant = "success" | "info";

interface Toast {
  id: number;
  title: string;
  message?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANTS: Record<ToastVariant, { color: string; bg: string; border: string; Icon: typeof CheckCircle2 }> = {
  success: { color: "#4A6347", bg: "rgba(74,99,71,0.06)", border: "rgba(74,99,71,0.30)", Icon: CheckCircle2 },
  info:    { color: "#9A7F35", bg: "rgba(184,155,74,0.08)", border: "rgba(184,155,74,0.35)", Icon: Info },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 3800);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-12 right-6 z-[80] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const v = VARIANTS[t.variant];
          const Icon = v.Icon;
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 bg-white border shadow-lg px-4 py-3 min-w-[280px] max-w-[380px] animate-fade-in-up"
              style={{ borderColor: v.border, borderLeft: `3px solid ${v.color}` }}
            >
              <div
                className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0"
                style={{ background: v.bg }}
              >
                <Icon size={14} style={{ color: v.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-body text-sm text-charcoal-deep font-medium">{t.title}</div>
                {t.message && (
                  <div className="font-body text-xs text-stone mt-0.5">{t.message}</div>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="p-1 hover:bg-parchment rounded-sm transition-colors"
              >
                <X size={12} className="text-stone" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

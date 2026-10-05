"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

export type FieldType =
  | "text"
  | "number"
  | "select"
  | "segment"
  | "datetime"
  | "duration"
  | "textarea";

export interface FieldProps {
  name: string;
  label: string;
  type?: FieldType;
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  options?: string[];
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  rows?: number;
  rightSlot?: ReactNode;
  className?: string;
}

export function Field(props: FieldProps) {
  const { name, label, hint, error, required, className } = props;
  return (
    <label className={cn("block", className)} htmlFor={name}>
      <span className="vg-label block mb-2">
        {label}
        {required && <span className="text-voyage-accent ml-1">*</span>}
      </span>
      <FieldInput {...props} />
      {error ? (
        <span className="text-[11px] text-voyage-danger mt-1.5 block">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-voyage-text-3 mt-1.5 block">{hint}</span>
      ) : null}
    </label>
  );
}

function FieldInput(props: FieldProps) {
  const {
    name,
    type = "text",
    value,
    defaultValue,
    onChange,
    options,
    placeholder,
    rows = 3,
    rightSlot,
  } = props;

  if (type === "segment" && options) {
    return (
      <div className="inline-flex p-1 rounded-lg bg-voyage-sunken border border-voyage-border-2">
        {options.map((opt) => {
          const active = (value ?? defaultValue) === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange?.(opt)}
              className={cn(
                "h-8 px-3 rounded-md text-[12px] font-medium transition-colors duration-200",
                active
                  ? "bg-voyage-accent-soft text-voyage-text"
                  : "text-voyage-text-2 hover:text-voyage-text"
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  if (type === "select" && options) {
    return (
      <div className="relative">
        <select
          id={name}
          name={name}
          defaultValue={defaultValue}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn("vg-input pr-9 appearance-none cursor-pointer")}
        >
          {!value && !defaultValue && <option value="">Select…</option>}
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-voyage-elevated">
              {opt}
            </option>
          ))}
        </select>
        <span aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-voyage-text-3 text-[10px]">▼</span>
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="vg-input"
      />
    );
  }

  const inputType =
    type === "datetime" ? "datetime-local" : type === "duration" || type === "number" ? "number" : "text";

  return (
    <div className="relative">
      <input
        id={name}
        name={name}
        type={inputType}
        defaultValue={defaultValue}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={cn("vg-input", rightSlot && "pr-10")}
      />
      {rightSlot && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-voyage-text-3 text-[12px]">
          {rightSlot}
        </span>
      )}
    </div>
  );
}

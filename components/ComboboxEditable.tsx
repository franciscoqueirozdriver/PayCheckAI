"use client";

import { useId, useMemo } from "react";

type Props = {
  label: string;
  value?: string;
  options?: string[];
  placeholder?: string;
  onChange: (val: string) => void;
};

export function ComboboxEditable({ label, value, options = [], placeholder, onChange }: Props) {
  const listId = useId();
  const uniq = useMemo(() => Array.from(new Set([value, ...options].filter(Boolean))) as string[], [value, options]);

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium" htmlFor={listId + "-input"}>{label}</label>
      <input
        id={listId + "-input"}
        list={listId}
        value={value ?? ""}
        placeholder={placeholder || "Digite ou escolha..."}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-md p-2 text-sm"
      />
      {uniq.length > 0 && (
        <datalist id={listId}>
          {uniq.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      )}
    </div>
  );
}


"use client";

import { useState } from "react";

type Props = {
  value?: string;
  onChange: (val: string) => void;
};

export function RubricasEditor({ value, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">rubricas_json</div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="px-2 py-1 border rounded-md text-sm"
        >
          {expanded ? "Ocultar JSON" : "Ver/Editar JSON"}
        </button>
      </div>

      {expanded ? (
        <textarea
          rows={8}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border rounded-md p-2 text-sm"
        />
      ) : (
        <div className="text-xs text-gray-500">
          {value?.slice(0, 200) || "Sem rubricas..."}{value && value.length > 200 ? " ..." : ""}
        </div>
      )}
    </div>
  );
}


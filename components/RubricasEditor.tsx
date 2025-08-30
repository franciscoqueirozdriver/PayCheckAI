"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
        <Button type="button" variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Ocultar JSON" : "Ver/Editar JSON"}
        </Button>
      </div>

      {expanded ? (
        <Textarea rows={8} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className="text-xs text-muted-foreground">
          {value?.slice(0, 200) || "Sem rubricas..."}{value && value.length > 200 ? " ..." : ""}
        </div>
      )}
    </div>
  );
}


"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Input } from "@/components/ui/input";

type Props = {
  label: string;
  value?: string;
  options?: string[];
  placeholder?: string;
  onChange: (val: string) => void;
};

export function ComboboxEditable({ label, value, options = [], placeholder, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const uniq = useMemo(() => Array.from(new Set([value, ...options].filter(Boolean))) as string[], [value, options]);

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex gap-2">
        <Input
          value={value ?? ""}
          placeholder={placeholder || "Digite ou escolha..."}
          onChange={(e) => onChange(e.target.value)}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="whitespace-nowrap">
              Opções <ChevronsUpDown className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-80">
            <Command>
              <CommandInput placeholder="Filtrar opções..." />
              <CommandEmpty>Nenhuma alternativa</CommandEmpty>
              <CommandGroup>
                {uniq.map((opt) => (
                  <CommandItem key={opt} value={opt} onSelect={() => { onChange(opt); setOpen(false); }}>
                    {opt}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}


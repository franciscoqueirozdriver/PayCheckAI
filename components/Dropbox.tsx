'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Input } from "@/components/ui/input";

type DropboxProps = {
  label: string;
  value?: string;
  candidates?: string[];
  placeholder?: string;
  onChange: (v: string) => void;
};

export function Dropbox({ label, value, candidates = [], placeholder, onChange }: DropboxProps) {
  const [open, setOpen] = useState(false);
  const uniq = Array.from(new Set([value, ...candidates].filter(Boolean))) as string[];

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex gap-2">
        <Input
          value={value ?? ""}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setOpen(false)}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="px-3 py-2 rounded-lg border text-sm whitespace-nowrap">Opções</button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-72">
            <Command>
              <CommandInput placeholder="Buscar alternativa..." />
              <CommandList>
                <CommandEmpty>Nenhuma alternativa</CommandEmpty>
                {uniq.map((opt) => (
                  <CommandItem
                    key={opt}
                    value={opt}
                    onSelect={() => { onChange(opt); setOpen(false); }}
                    className="truncate"
                  >
                    {opt}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

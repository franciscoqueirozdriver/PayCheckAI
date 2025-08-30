"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Input } from "@/components/ui/input";

const ChevronsUpDown = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m7 15 5 5 5-5" />
    <path d="m7 9 5-5 5 5" />
  </svg>
);

type Props = {
  label: string;
  value?: string;
  options?: string[];
  placeholder?: string;
  onChange: (val: string) => void;
};

export function ComboboxEditable({ label, value, options = [], placeholder, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const uniq = useMemo(() => Array.from(new Set([value, ...options].filter(Boolean))) as string[], [value, options]);
  const filtered = uniq.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex gap-2 relative">
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
              <CommandInput
                placeholder="Filtrar opções..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {filtered.length === 0 ? (
                <CommandEmpty>Nenhuma alternativa</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filtered.map((opt) => (
                    <CommandItem
                      key={opt}
                      onSelect={() => {
                        onChange(opt);
                        setOpen(false);
                      }}
                    >
                      {opt}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

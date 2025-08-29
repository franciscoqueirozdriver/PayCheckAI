'use client';

import { useState } from 'react';

interface DropboxProps {
  label: string;
  value?: string;
  candidates?: string[];
  placeholder?: string;
  onChange: (v: string) => void;
}

export function Dropbox({ label, value, candidates = [], placeholder, onChange }: DropboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const uniq = Array.from(new Set([value, ...candidates].filter(Boolean))) as string[];
  const filtered = uniq.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex gap-2 relative">
        <input
          value={value ?? ''}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setOpen(false)}
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="button"
          className="px-3 py-2 rounded-lg border text-sm"
          onClick={() => setOpen(o => !o)}
        >
          Opções
        </button>
        {open && (
          <div className="absolute z-10 right-0 top-full mt-1 w-72 bg-white border rounded-md shadow">
            <div className="p-2 border-b">
              <input
                autoFocus
                placeholder="Buscar alternativa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="max-h-48 overflow-auto">
              {filtered.length === 0 && (
                <div className="p-2 text-sm text-gray-500">Nenhuma alternativa</div>
              )}
              {filtered.map(opt => (
                <div
                  key={opt}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 truncate"
                  onClick={() => { onChange(opt); setOpen(false); setSearch(''); }}
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { AliquotasGlobais } from '@/src/types/paycheckai';

interface GlobalRatesProps {
  aliquotas: AliquotasGlobais;
  setAliquotas: (a: AliquotasGlobais) => void;
  onApply: () => void;
}

export default function GlobalRates({ aliquotas, setAliquotas, onApply }: GlobalRatesProps) {
  const handleChange = (field: keyof AliquotasGlobais) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'locked' ? e.target.checked : Number(e.target.value);
    setAliquotas({ ...aliquotas, [field]: value });
  };

  return (
    <section className="p-4 bg-white shadow mb-4 flex flex-wrap gap-4 items-end">
      <div>
        <label className="block text-sm font-medium">% Imposto (global)</label>
        <input
          type="number"
          className="border rounded p-1 w-20"
          value={aliquotas.imposto}
          onChange={handleChange('imposto')}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">% Comissão (global)</label>
        <input
          type="number"
          className="border rounded p-1 w-20"
          value={aliquotas.comissao}
          onChange={handleChange('comissao')}
        />
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={aliquotas.locked}
          onChange={handleChange('locked')}
        />
        Travar e aplicar a todas as linhas
      </label>
      <button
        type="button"
        className="bg-blue-600 text-white px-4 py-1 rounded"
        onClick={onApply}
      >
        Aplicar às linhas existentes
      </button>
    </section>
  );
}

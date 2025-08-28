'use client';

import React from 'react';
import { AliquotasGlobais } from '../../types/dsr';

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

  const inputStyle = "w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const labelStyle = "block text-sm font-medium text-muted-foreground mb-1";
  const checkboxLabelStyle = "flex items-center gap-2 text-sm text-muted-foreground font-normal";
  const checkboxStyle = "h-4 w-4 rounded border-primary text-primary-500 focus:ring-primary-400";
  const buttonStyle = "bg-primary-500 text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold shadow-sm hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors";


  return (
    <section className="bg-card text-card-foreground p-card-p rounded-2xl shadow-elevation-1 mb-6">
       <h3 className="text-base font-semibold mb-3 text-foreground">Alíquotas Globais</h3>
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className={labelStyle}>% Imposto (global)</label>
          <input
            type="number"
            className={inputStyle}
            value={aliquotas.imposto}
            onChange={handleChange('imposto')}
          />
        </div>
        <div>
          <label className={labelStyle}>% Comissão (global)</label>
          <input
            type="number"
            className={inputStyle}
            value={aliquotas.comissao}
            onChange={handleChange('comissao')}
          />
        </div>
        <label className={`${checkboxLabelStyle} pb-2`}>
          <input
            type="checkbox"
            className={checkboxStyle}
            checked={aliquotas.locked}
            onChange={handleChange('locked')}
          />
          Travar e aplicar a todas as linhas
        </label>
        <button
          type="button"
          className={buttonStyle}
          onClick={onApply}
        >
          Aplicar às linhas existentes
        </button>
      </div>
    </section>
  );
}

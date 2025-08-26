'use client';

import React from 'react';
import { BasesSelecionadas } from '../../types/dsr';

interface FiltersProps {
  bases: BasesSelecionadas;
  onBasesChange: (b: BasesSelecionadas) => void;
  includeSaturday: boolean;
  setIncludeSaturday: (v: boolean) => void;
  uf: string;
  municipio: string;
  setUF: (uf: string) => void;
  setMunicipio: (m: string) => void;
  considerarFeriados: boolean;
  setConsiderarFeriados: (v: boolean) => void;
}

const municipiosPorUF: Record<string, string[]> = {
  SP: ['São Paulo', 'Campinas'],
  RJ: ['Rio de Janeiro', 'Niterói'],
};

export default function Filters({
  bases,
  onBasesChange,
  includeSaturday,
  setIncludeSaturday,
  uf,
  municipio,
  setUF,
  setMunicipio,
  considerarFeriados,
  setConsiderarFeriados,
}: FiltersProps) {
  const handleBase = (key: keyof BasesSelecionadas) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onBasesChange({ ...bases, [key]: e.target.checked });
  };

  const handleUF = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUF = e.target.value;
    setUF(newUF);
    setMunicipio('');
  };

  const municipios = municipiosPorUF[uf] || [];

  return (
    <section className="p-4 bg-white shadow mb-4 flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={bases.comissaoValorBruto}
            onChange={handleBase('comissaoValorBruto')}
          />
          Comissão sobre o Valor Bruto
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={bases.comissaoValorLiquido}
            onChange={handleBase('comissaoValorLiquido')}
          />
          Comissão sobre o Valor Líquido
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={bases.dsrValorBruto}
            onChange={handleBase('dsrValorBruto')}
          />
          DSR sobre o Valor Bruto
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={bases.dsrValorLiquido}
            onChange={handleBase('dsrValorLiquido')}
          />
          DSR sobre o Valor Líquido
        </label>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={!includeSaturday}
              onChange={() => setIncludeSaturday(false)}
            />
            Usar dias úteis SEM sábado
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={includeSaturday}
              onChange={() => setIncludeSaturday(true)}
            />
            Usar dias úteis COM sábado
          </label>
        </div>
        <p className="text-xs text-gray-600">
          Inclua o sábado apenas se o colaborador cumpre 44h semanais ou há
          compensação formal. Caso contrário, usar apenas dias úteis sem sábado.
        </p>
      </div>
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium">UF</label>
          <select
            value={uf}
            onChange={handleUF}
            className="border rounded p-1"
          >
            <option value="">Selecione</option>
            {Object.keys(municipiosPorUF).map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Município</label>
          <select
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className="border rounded p-1"
          >
            <option value="">Selecione</option>
            {municipios.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={considerarFeriados}
            onChange={(e) => setConsiderarFeriados(e.target.checked)}
          />
          Considerar feriados locais no cálculo dos dias de descanso
        </label>
      </div>
    </section>
  );
}

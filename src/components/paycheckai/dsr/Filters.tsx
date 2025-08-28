'use client';

import React, { useState, useEffect } from 'react';
import { BasesSelecionadas } from '@/src/types/paycheckai';

// Type for the dropdown options
interface SelectOption {
  value: string;
  label: string;
}

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
  const [states, setStates] = useState<SelectOption[]>([]);
  const [municipalities, setMunicipalities] = useState<SelectOption[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(true);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(false);

  // Fetch states on component mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch('/api/paycheckai/ibge/estados');
        if (!response.ok) throw new Error('Failed to fetch states');
        const data: SelectOption[] = await response.json();
        setStates(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingStates(false);
      }
    };
    fetchStates();
  }, []);

  // Fetch municipalities when UF changes
  useEffect(() => {
    if (!uf) {
      setMunicipalities([]);
      return;
    }
    const fetchMunicipalities = async () => {
      setIsLoadingMunicipalities(true);
      try {
        const response = await fetch(`/api/paycheckai/ibge/municipios?uf=${uf}`);
        if (!response.ok) throw new Error('Failed to fetch municipalities');
        const data: SelectOption[] = await response.json();
        setMunicipalities(data);
      } catch (error) {
        console.error(error);
        setMunicipalities([]);
      } finally {
        setIsLoadingMunicipalities(false);
      }
    };
    fetchMunicipalities();
  }, [uf]);


  const handleBase = (key: keyof BasesSelecionadas) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onBasesChange({ ...bases, [key]: e.target.checked });
  };

  const handleUFChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUF = e.target.value;
    setUF(newUF); // This will also reset municipio in the parent component
  };

  return (
    <section className="p-4 bg-white shadow mb-4 flex flex-col gap-4">
      {/* Bases checkboxes are unchanged */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2"><input type="checkbox" checked={bases.comissaoValorBruto} onChange={handleBase('comissaoValorBruto')} /> Comissão sobre o Valor Bruto</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={bases.comissaoValorLiquido} onChange={handleBase('comissaoValorLiquido')} /> Comissão sobre o Valor Líquido</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={bases.dsrValorBruto} onChange={handleBase('dsrValorBruto')} /> DSR sobre o Valor Bruto</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={bases.dsrValorLiquido} onChange={handleBase('dsrValorLiquido')} /> DSR sobre o Valor Líquido</label>
      </div>

      {/* Include Saturday radio buttons are unchanged */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="radio" checked={!includeSaturday} onChange={() => setIncludeSaturday(false)} /> Usar dias úteis SEM sábado</label>
          <label className="flex items-center gap-2"><input type="radio" checked={includeSaturday} onChange={() => setIncludeSaturday(true)} /> Usar dias úteis COM sábado</label>
        </div>
        <p className="text-xs text-gray-600">Inclua o sábado apenas se o colaborador cumpre 44h semanais ou há compensação formal. Caso contrário, usar apenas dias úteis sem sábado.</p>
      </div>

      {/* Location and Holiday filters are now dynamic */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label htmlFor="uf-select" className="block text-sm font-medium">UF</label>
          <select
            id="uf-select"
            value={uf}
            onChange={handleUFChange}
            className="border rounded p-1"
            disabled={isLoadingStates}
          >
            <option value="">{isLoadingStates ? 'Carregando...' : 'Selecione'}</option>
            {states.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="municipio-select" className="block text-sm font-medium">Município</label>
          <select
            id="municipio-select"
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className="border rounded p-1"
            disabled={!uf || isLoadingMunicipalities}
          >
            <option value="">{isLoadingMunicipalities ? 'Carregando...' : 'Selecione'}</option>
            {municipalities.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
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

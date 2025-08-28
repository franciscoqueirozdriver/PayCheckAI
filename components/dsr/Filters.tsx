'use client';

import React, { useState, useEffect } from 'react';
import { BasesSelecionadas } from '../../types/dsr';

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
        const response = await fetch('/api/ibge/estados');
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
        const response = await fetch(`/api/ibge/municipios?uf=${uf}`);
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

  const inputStyle = "w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed";
  const labelStyle = "block text-sm font-medium text-muted-foreground mb-1";
  const checkboxLabelStyle = "flex items-center gap-2 text-sm text-muted-foreground font-normal";
  const checkboxStyle = "h-4 w-4 rounded border-primary text-primary-500 focus:ring-primary-400";


  return (
    <section className="bg-card text-card-foreground p-card-p rounded-2xl shadow-elevation-1 mb-6 space-y-6">
      {/* Base de Cálculo */}
      <div>
        <h3 className="text-base font-semibold mb-3 text-foreground">Base de Cálculo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className={checkboxLabelStyle}><input type="checkbox" className={checkboxStyle} checked={bases.comissaoValorBruto} onChange={handleBase('comissaoValorBruto')} /> Comissão (Bruto)</label>
          <label className={checkboxLabelStyle}><input type="checkbox" className={checkboxStyle} checked={bases.comissaoValorLiquido} onChange={handleBase('comissaoValorLiquido')} /> Comissão (Líquido)</label>
          <label className={checkboxLabelStyle}><input type="checkbox" className={checkboxStyle} checked={bases.dsrValorBruto} onChange={handleBase('dsrValorBruto')} /> DSR (Bruto)</label>
          <label className={checkboxLabelStyle}><input type="checkbox" className={checkboxStyle} checked={bases.dsrValorLiquido} onChange={handleBase('dsrValorLiquido')} /> DSR (Líquido)</label>
        </div>
      </div>

      {/* Dias Úteis */}
      <div>
        <h3 className="text-base font-semibold mb-3 text-foreground">Opções de Dias Úteis</h3>
        <div className="flex flex-col gap-2">
          <div className="flex gap-4">
            <label className={checkboxLabelStyle}><input type="radio" name="include-saturday" checked={!includeSaturday} onChange={() => setIncludeSaturday(false)} /> Usar dias úteis SEM sábado</label>
            <label className={checkboxLabelStyle}><input type="radio" name="include-saturday" checked={includeSaturday} onChange={() => setIncludeSaturday(true)} /> Usar dias úteis COM sábado</label>
          </div>
          <p className="text-xs text-muted-foreground">Inclua o sábado apenas se o colaborador cumpre 44h semanais ou há compensação formal.</p>
        </div>
      </div>

      {/* Feriados */}
      <div>
        <h3 className="text-base font-semibold mb-3 text-foreground">Feriados</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="uf-select" className={labelStyle}>Estado (UF)</label>
            <select id="uf-select" value={uf} onChange={handleUFChange} className={inputStyle} disabled={isLoadingStates}>
              <option value="">{isLoadingStates ? 'Carregando...' : 'Selecione'}</option>
              {states.map((state) => (
                <option key={state.value} value={state.value}>{state.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="municipio-select" className={labelStyle}>Município</label>
            <select id="municipio-select" value={municipio} onChange={(e) => setMunicipio(e.target.value)} className={inputStyle} disabled={!uf || isLoadingMunicipalities}>
              <option value="">{isLoadingMunicipalities ? 'Carregando...' : 'Selecione'}</option>
              {municipalities.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <label className={`${checkboxLabelStyle} pb-2`}>
            <input type="checkbox" className={checkboxStyle} checked={considerarFeriados} onChange={(e) => setConsiderarFeriados(e.target.checked)} />
            Considerar feriados locais
          </label>
        </div>
      </div>
    </section>
  );
}

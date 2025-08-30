'use client';

import React, { useEffect, useState, useMemo } from 'react';
import HeaderStats from '../components/dsr/HeaderStats';
import Filters from '../components/dsr/Filters';
import GlobalRates from '../components/dsr/GlobalRates';
import PaymentsTable from '../components/dsr/PaymentsTable';
import HoleriteUploader from '../components/HoleriteUploader';
import {
  Payment,
  BasesSelecionadas,
  AliquotasGlobais,
} from '../types/dsr';
import { applyGlobalRatesToRows } from '../lib/dsr';

// --- Type definition for the new API response ---
interface CalendarData {
  businessDays: {
    withSaturday: number;
    withoutSaturday: number;
  };
  sundays: number;
  holidaysUtil: number;
}

// --- Default values remain the same ---
const DEFAULT_BASES: BasesSelecionadas = {
  comissaoValorBruto: true,
  comissaoValorLiquido: true,
  dsrValorBruto: true,
  dsrValorLiquido: true,
};

const DEFAULT_ALIQUOTAS: AliquotasGlobais = {
  imposto: 19,
  comissao: 20,
  locked: true,
};

const DEFAULT_PARAMS = {
  period: '2025-08',
  includeSaturday: false,
  uf: '',
  municipio: '', // This should be the IBGE code
  considerarFeriados: false,
};

const DEFAULT_ROWS: Payment[] = [
  { id: '1', dataPagamento: '2025-08-29', empresa: 'Driver Empresa 03', tipo: 'Mensalidade', parcela: '6 de 6', valorBruto: 7000, percImposto: 19, percComissao: 20, status: 'Previsto' },
  { id: '2', dataPagamento: '2025-08-03', empresa: 'Driver Empresa 05', tipo: 'Mensalidade', parcela: '4 de 6', valorBruto: 9000, percImposto: 19, percComissao: 20, status: 'Previsto' },
  { id: '3', dataPagamento: '2025-08-30', empresa: 'Driver Empresa 01', tipo: 'Implantação', parcela: '2 de 2', valorBruto: 45000, percImposto: 19, percComissao: 20, status: 'Previsto' },
  { id: '4', dataPagamento: '2025-08-30', empresa: 'Driver Empresa 06', tipo: 'Mensalidade', parcela: '2 de 6', valorBruto: 9000, percImposto: 19, percComissao: 20, status: 'Previsto' },
  { id: '5', dataPagamento: '2025-08-04', empresa: 'Driver Empresa 04', tipo: 'Implantação', parcela: '2 de 2', valorBruto: 20000, percImposto: 19, percComissao: 20, status: 'Previsto' },
  { id: '6', dataPagamento: '2025-08-04', empresa: 'Driver Empresa 04', tipo: 'Implantação', parcela: '2 de 2', valorBruto: 60000, percImposto: 19, percComissao: 20, status: 'Previsto' },
];

export default function Page() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [aliquotas, setAliquotas] = useState<AliquotasGlobais>(DEFAULT_ALIQUOTAS);
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [bases, setBases] = useState<BasesSelecionadas>(DEFAULT_BASES);

  // --- New state for API data ---
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);

  // Load from localStorage (runs once on mount)
  useEffect(() => {
    const storedRows = localStorage.getItem('dsr_lancamentos');
    const storedAliq = localStorage.getItem('dsr_aliquotas_globais');
    const storedParams = localStorage.getItem('dsr_parametros');
    if (storedRows) setRows(JSON.parse(storedRows));
    else setRows(DEFAULT_ROWS);
    if (storedAliq) setAliquotas(JSON.parse(storedAliq));
    if (storedParams) {
      const parsed = JSON.parse(storedParams);
      setParams({ ...DEFAULT_PARAMS, ...parsed });
      setBases(parsed.bases || DEFAULT_BASES);
    }
  }, []);

  // Persist state to localStorage (unchanged)
  useEffect(() => { localStorage.setItem('dsr_lancamentos', JSON.stringify(rows)); }, [rows]);
  useEffect(() => { localStorage.setItem('dsr_aliquotas_globais', JSON.stringify(aliquotas)); }, [aliquotas]);
  useEffect(() => { localStorage.setItem('dsr_parametros', JSON.stringify({ ...params, bases })); }, [params, bases]);

  // Apply global rates when locked (unchanged)
  useEffect(() => {
    if (aliquotas.locked) {
      setRows((prev) => applyGlobalRatesToRows(prev, aliquotas));
    }
  }, [aliquotas.imposto, aliquotas.comissao, aliquotas.locked]);

  // --- NEW: Fetch calendar data from API ---
  useEffect(() => {
    const fetchCalendarData = async () => {
      setIsLoadingCalendar(true);
      const [year, month] = params.period.split('-').map(Number);

      const query = new URLSearchParams({
        year: String(year),
        month: String(month),
        uf: params.uf,
        ibge: params.municipio,
        includeSaturday: params.includeSaturday ? '1' : '0',
        considerarFeriados: params.considerarFeriados ? '1' : '0',
      });

      try {
        const response = await fetch(`/api/dsr/calendario?${query.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch calendar data');
        }
        const data: CalendarData = await response.json();
        setCalendarData(data);
      } catch (error) {
        console.error(error);
        setCalendarData(null); // Reset on error
      } finally {
        setIsLoadingCalendar(false);
      }
    };

    if (params.period) {
      fetchCalendarData();
    }
  }, [params.period, params.uf, params.municipio, params.includeSaturday, params.considerarFeriados]);

  // --- NEW: Derive calendar values from state ---
  const diasUteisSemSabado = calendarData?.businessDays.withoutSaturday ?? 0;
  const diasUteisComSabado = calendarData?.businessDays.withSaturday ?? 0;
  const diasDescanso = (calendarData?.sundays ?? 0) + (calendarData?.holidaysUtil ?? 0);
  const diasUteisDivisor = params.includeSaturday
    ? diasUteisComSabado
    : diasUteisSemSabado;

  // --- Handlers are mostly unchanged ---
  const handlePeriodChange = (value: string) => setParams((p) => ({ ...p, period: value }));
  const handleAddRow = () => {
    setRows((r) => [
      ...r,
      {
        id: Date.now().toString(),
        dataPagamento: '',
        empresa: '',
        tipo: 'Mensalidade',
        parcela: '',
        valorBruto: 0,
        percImposto: aliquotas.imposto,
        percComissao: aliquotas.comissao,
        status: 'Previsto',
      },
    ]);
  };
  const handleRowChange = (id: string, field: keyof Payment, value: any) => {
    setRows((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };
  const handleRowRemove = (id: string) => {
    setRows((rows) => rows.filter((r) => r.id !== id));
  };
  const handleApplyRates = () => { setRows((prev) => applyGlobalRatesToRows(prev, aliquotas)); };

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <HoleriteUploader />
      <HeaderStats
        period={params.period}
        onPeriodChange={handlePeriodChange}
        diasUteisSemSabado={isLoadingCalendar ? '...' : diasUteisSemSabado}
        diasUteisComSabado={isLoadingCalendar ? '...' : diasUteisComSabado}
        diasDescanso={isLoadingCalendar ? '...' : diasDescanso}
      />
      <Filters
        bases={bases}
        onBasesChange={setBases}
        includeSaturday={params.includeSaturday}
        setIncludeSaturday={(v) => setParams((p) => ({ ...p, includeSaturday: v }))}
        uf={params.uf}
        municipio={params.municipio}
        setUF={(uf) => setParams((p) => ({ ...p, uf, municipio: '' }))} // Reset municipio on UF change
        setMunicipio={(m) => setParams((p) => ({ ...p, municipio: m }))}
        considerarFeriados={params.considerarFeriados}
        setConsiderarFeriados={(v) => setParams((p) => ({ ...p, considerarFeriados: v }))}
      />
      <GlobalRates
        aliquotas={aliquotas}
        setAliquotas={setAliquotas}
        onApply={handleApplyRates}
      />
      <PaymentsTable
        rows={rows}
        onAdd={handleAddRow}
        onRemove={handleRowRemove}
        onChange={handleRowChange}
        bases={bases}
        locked={aliquotas.locked}
        diasDescanso={diasDescanso}
        diasUteisDivisor={diasUteisDivisor}
      />
      <button className="fixed right-4 bottom-4 bg-gray-700 text-white p-3 rounded-full">
        ⚙️
      </button>
    </main>
  );
}

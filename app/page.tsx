'use client';

import React, { useEffect, useState, useMemo } from 'react';
import HeaderStats from '../components/dsr/HeaderStats';
import Filters from '../components/dsr/Filters';
import GlobalRates from '../components/dsr/GlobalRates';
import PaymentsTable from '../components/dsr/PaymentsTable';
import {
  Payment,
  BasesSelecionadas,
  AliquotasGlobais,
} from '../types/dsr';
import { applyGlobalRatesToRows } from '../lib/dsr';
// New imports from user's example
import HoleriteReviewDialog from "@/components/HoleriteReviewDialog";
import type { HoleriteDraft, CandidatesMap } from "@/models/holerite";
import { Button } from "@/components/ui/button";


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

// New type from user's example
type Item = { file: File; extracted: HoleriteDraft; candidates: CandidatesMap };

export default function Page() {
  // DSR States
  const [rows, setRows] = useState<Payment[]>([]);
  const [aliquotas, setAliquotas] = useState<AliquotasGlobais>(DEFAULT_ALIQUOTAS);
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [bases, setBases] = useState<BasesSelecionadas>(DEFAULT_BASES);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);

  // New Holerite import states
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rawTextData, setRawTextData] = useState<any>(null);

  // New Holerite handlers
  async function handleImport(input: HTMLInputElement) {
    const files = Array.from(input.files || []);
    if (!files.length) return;

    setRawTextData('Extraindo texto...');
    const fd = new FormData();
    files.forEach(f => fd.append("files", f));

    const res = await fetch("/api/holerites/import", { method: "POST", body: fd });
    const results = await res.json();
    setRawTextData(results);

    input.value = ""; // limpa seleção
  }

  async function saveToSheets(finalData: HoleriteDraft) {
    const r = await fetch("/api/holerites/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalData),
    });
    if (!r.ok) {
        // A simple alert for now, could be a toast notification
        alert("Falha ao salvar o holerite.");
        throw new Error("Falha ao salvar");
    }

    // Advance to the next item if there is one
    if (idx < items.length - 1) {
      setIdx(prev => prev + 1);
    } else {
      // If it's the last one, close the modal
      setOpen(false);
    }
  }

  // Load from localStorage (runs once on mount) - DSR
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

  // Persist state to localStorage (unchanged) - DSR
  useEffect(() => { localStorage.setItem('dsr_lancamentos', JSON.stringify(rows)); }, [rows]);
  useEffect(() => { localStorage.setItem('dsr_aliquotas_globais', JSON.stringify(aliquotas)); }, [aliquotas]);
  useEffect(() => { localStorage.setItem('dsr_parametros', JSON.stringify({ ...params, bases })); }, [params, bases]);

  // Apply global rates when locked (unchanged) - DSR
  useEffect(() => {
    if (aliquotas.locked) {
      setRows((prev) => applyGlobalRatesToRows(prev, aliquotas));
    }
  }, [aliquotas.imposto, aliquotas.comissao, aliquotas.locked]);

  // Fetch calendar data from API - DSR
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

  // Derive calendar values from state - DSR
  const diasUteisSemSabado = calendarData?.businessDays.withoutSaturday ?? 0;
  const diasUteisComSabado = calendarData?.businessDays.withSaturday ?? 0;
  const diasDescanso = (calendarData?.sundays ?? 0) + (calendarData?.holidaysUtil ?? 0);
  const diasUteisDivisor = params.includeSaturday
    ? diasUteisComSabado
    : diasUteisSemSabado;

  // DSR Handlers
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

  const current = items[idx];

  return (
    <>
    <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <section className="bg-card p-card-p rounded-2xl shadow-elevation-1">
        <h2 className="text-xl font-bold mb-4">Importar Holerites</h2>
        <div className="flex items-center gap-3">
            <input id="uploader" type="file" accept="application/pdf" multiple hidden onChange={(e) => handleImport(e.currentTarget)} />
            <Button onClick={() => document.getElementById("uploader")?.click()}>Importar holerites</Button>
        </div>
      </section>

      {rawTextData && (
        <section className="bg-card p-card-p rounded-2xl shadow-elevation-1">
            <h2 className="text-xl font-bold mb-4">Passo 1: Texto Extraído</h2>
            <p className="text-sm text-muted-foreground mb-4">O texto abaixo foi extraído do seu PDF. Por favor, verifique se ele corresponde ao conteúdo do arquivo. Se estiver correto, podemos prosseguir para a próxima etapa de identificação dos campos.</p>
            <div className="text-xs bg-gray-100 p-4 rounded-md overflow-auto max-h-96">{JSON.stringify(rawTextData, null, 2)}</div>
        </section>
      )}

      {/* DSR Components */}
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
      <button className="fixed right-4 bottom-4 bg-gray-700 text-white p-3 rounded-full">⚙️</button>
    </main>
    <HoleriteReviewDialog
        open={open}
        onOpenChange={setOpen}
        file={current?.file}
        extracted={current?.extracted || {}}
        candidates={current?.candidates || {}}
        onSave={saveToSheets}
    />
    </>
  );
}

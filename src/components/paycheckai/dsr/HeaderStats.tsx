'use client';

import React from 'react';

interface HeaderStatsProps {
  period: string;
  onPeriodChange: (value: string) => void;
  diasUteisSemSabado: number | string;
  diasUteisComSabado: number | string;
  diasDescanso: number | string;
}

export default function HeaderStats({
  period,
  onPeriodChange,
  diasUteisSemSabado,
  diasUteisComSabado,
  diasDescanso,
}: HeaderStatsProps) {
  return (
    <header className="p-4 bg-white shadow mb-4">
      <h1 className="text-2xl font-bold mb-4">Cálculo de DSR</h1>
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium">Mês/Ano</label>
          <input
            type="month"
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="border rounded p-1"
          />
        </div>
        <div className="flex flex-col text-sm">
          <span className="font-semibold">Dias úteis s/ sábado:</span>
          <span>{diasUteisSemSabado}</span>
        </div>
        <div className="flex flex-col text-sm">
          <span className="font-semibold">Dias úteis c/ sábado:</span>
          <span>{diasUteisComSabado}</span>
        </div>
        <div className="flex flex-col text-sm">
          <span className="font-semibold">Dias de descanso:</span>
          <span>{diasDescanso}</span>
        </div>
      </div>
    </header>
  );
}

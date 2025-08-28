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
    <section className="bg-card text-card-foreground p-card-p rounded-2xl shadow-elevation-1 mb-6">
      <h1 className="text-2xl font-bold mb-4 text-foreground">Cálculo de DSR</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-end">
        {/* Period Selector */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Mês/Ano</label>
          <input
            type="month"
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Stats */}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">Dias úteis s/ sábado</span>
          <span className="text-2xl font-bold text-foreground">{diasUteisSemSabado}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">Dias úteis c/ sábado</span>
          <span className="text-2xl font-bold text-foreground">{diasUteisComSabado}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">Dias de descanso</span>
          <span className="text-2xl font-bold text-primary-500">{diasDescanso}</span>
        </div>
      </div>
    </section>
  );
}

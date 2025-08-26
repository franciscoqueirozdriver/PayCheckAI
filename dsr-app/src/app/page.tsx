"use client";

import React, { useState } from 'react';
import PagamentosForm from '@/components/PagamentosForm'; // Renamed import
import ConfigurationPanel from '@/components/ConfigurationPanel';
import ReportDisplay from '@/components/ReportDisplay';
import { PaymentRow } from '@/lib/dsr-calculator';

// Add a unique id to each payment row for React key prop
export interface PaymentRowWithId extends PaymentRow {
  id: number;
}

// Type for the entire API response
export interface CalculationResult {
  details: any[];
  totals: any;
  dayCounts: {
    diasSemSabado: number;
    diasComSabado: number;
    diasDescanso: number;
  };
}

export default function Home() {
  // State for the list of payments
  const [payments, setPayments] = useState<PaymentRowWithId[]>([
    { id: 1, valor_bruto: '5000,00', percentual_imposto: '10', percentual_comissao: '5' }
  ]);

  // State for config options
  const [mesAno, setMesAno] = useState('2024-08');
  const [usarComSabado, setUsarComSabado] = useState(false);

  // State for the API response
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setIsLoading(true);
    setError(null);
    setCalculationResult(null);

    try {
      const response = await fetch('/api/calculate-dsr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payments: payments,
          mesAno: mesAno,
          usarComSabado: usarComSabado,
        }),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || 'Falha ao calcular DSR.');
      }

      const result = await response.json();
      setCalculationResult(result);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow-md mb-8">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Calculadora de DSR sobre Comissões
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Coluna da Esquerda: Inputs */}
        <div className="space-y-8">
          <ConfigurationPanel
            mesAno={mesAno}
            setMesAno={setMesAno}
            usarComSabado={usarComSabado}
            setUsarComSabado={setUsarComSabado}
          />
          <PagamentosForm
            payments={payments}
            setPayments={setPayments}
          />
          <button
            onClick={handleCalculate}
            disabled={isLoading || payments.length === 0}
            className="w-full py-3 px-4 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Calculando...' : 'Calcular DSR'}
          </button>
        </div>

        {/* Coluna da Direita: Relatório */}
        <div className="space-y-8">
           <section className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">Relatório de Auditoria</h2>
              {isLoading && <div className="text-center p-8"><p>Carregando resultado...</p></div>}
              {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"><p><b>Erro:</b> {error}</p></div>}
              {calculationResult ? (
                <ReportDisplay result={calculationResult} />
              ) : (
                !isLoading && !error && <p className="text-gray-500 text-center p-8">O relatório aparecerá aqui após o cálculo.</p>
              )}
            </section>
        </div>

      </main>
    </div>
  );
}

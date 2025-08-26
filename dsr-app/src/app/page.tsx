"use client"; // Mark this as a Client Component

import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import ManualEntryForm from '@/components/ManualEntryForm';
import ConfigurationPanel from '@/components/ConfigurationPanel';
import ReportDisplay from '@/components/ReportDisplay';

// Define types for our state
interface ReportData {
  employeeId: string;
  month: string;
  totalCommission: number;
  workingDays: number;
  sundaysAndHolidays: number;
  calculatedDSR: number;
  paidDSR: number;
  difference: number;
}

export default function Home() {
  // State for the report data
  const [reportData, setReportData] = useState<ReportData | null>(null);
  // State for loading indicators
  const [isLoading, setIsLoading] = useState(false);
  // State for error messages
  const [error, setError] = useState<string | null>(null);

  // This function will be called by child components to trigger a calculation
  const handleCalculate = async (params: { totalCommission: number, workingDays: number, restDays: number, paidDSR: number }) => {
    setIsLoading(true);
    setError(null);
    setReportData(null);

    try {
      const response = await fetch('/api/calculate-dsr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalCommission: params.totalCommission,
          workingDays: params.workingDays,
          restDays: params.restDays,
        }),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || 'Falha ao calcular DSR.');
      }

      const result = await response.json();

      // Update state with the new report data
      setReportData({
        ...params, // Should include employeeId, month etc. in a real scenario
        employeeId: 'Manual', // Placeholder
        month: 'Atual', // Placeholder
        sundaysAndHolidays: params.restDays,
        calculatedDSR: result.calculatedDSR,
        paidDSR: params.paidDSR,
        difference: parseFloat((result.calculatedDSR - params.paidDSR).toFixed(2)),
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow-md">
        <nav className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-700">
            Sistema de Auditoria de DSR sobre Comissões
          </h1>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-1 space-y-8">
            <section className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">1. Upload de Arquivos</h2>
              <p className="text-sm text-gray-600 mb-4">
                (Funcionalidade simulada)
              </p>
              <FileUpload />
            </section>

            <section className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">2. Entrada Manual</h2>
              <p className="text-sm text-gray-600 mb-4">
                Use o formulário para um cálculo rápido.
              </p>
              <ManualEntryForm onCalculate={handleCalculate} />
            </section>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">3. Configuração do Cálculo</h2>
               <p className="text-sm text-gray-600 mb-4">
                Ajuste os parâmetros para o cálculo.
              </p>
              <ConfigurationPanel />
            </section>

            <section className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">4. Relatório de Auditoria</h2>
                {isLoading && <p>Calculando...</p>}
                {error && <p className="text-red-500">Erro: {error}</p>}
                {reportData ? (
                  <ReportDisplay reportData={reportData} />
                ) : (
                  <p className="text-gray-500">O relatório aparecerá aqui após o cálculo.</p>
                )}
            </section>
          </div>

        </div>
      </main>

      <footer className="bg-white mt-12">
        <div className="container mx-auto px-6 py-4 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} DSR Audit System. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

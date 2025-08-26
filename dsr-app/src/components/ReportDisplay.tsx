import React from 'react';
import { CalculationResult } from '../app/page';
import { formatCurrency } from '@/lib/dsr-calculator';

interface ReportDisplayProps {
  result: CalculationResult;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ result }) => {
  const { details, totals, dayCounts } = result;

  const handleExportCSV = () => {
    const headers = [
        'Comissao Bruta (R$)',
        'Comissao Liquida (R$)',
        'DSR Bruto (R$)',
        'DSR Liquido (R$)',
    ];

    const rows = details.map(d => [
        d.comissaoBruta.toFixed(2).replace('.',','),
        d.comissaoLiquida.toFixed(2).replace('.',','),
        d.dsrBruto.toFixed(2).replace('.',','),
        d.dsrLiquido.toFixed(2).replace('.',',')
    ].join(';')); // Use semicolon for Brazilian Excel compatibility

    const totalsRow = [
        totals.totalComissaoBruta.toFixed(2).replace('.',','),
        totals.totalComissaoLiquida.toFixed(2).replace('.',','),
        totals.totalDsrBruto.toFixed(2).replace('.',','),
        totals.totalDsrLiquido.toFixed(2).replace('.',',')
    ].join(';');

    const csvContent = [
        headers.join(';'),
        ...rows,
        'Totais;' + totalsRow
    ].join('\n');

    // Add BOM for UTF-8 Excel compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_dsr.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">Dias Úteis (Sem Sáb.)</p>
          <p className="text-2xl font-bold">{dayCounts.diasSemSabado}</p>
        </div>
        <div className="p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">Dias Úteis (Com Sáb.)</p>
          <p className="text-2xl font-bold">{dayCounts.diasComSabado}</p>
        </div>
        <div className="p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">Dias de Descanso</p>
          <p className="text-2xl font-bold">{dayCounts.diasDescanso}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-3">Comissão Bruta</th>
              <th className="px-4 py-3">Comissão Líquida</th>
              <th className="px-4 py-3">DSR (Bruto)</th>
              <th className="px-4 py-3">DSR (Líquido)</th>
            </tr>
          </thead>
          <tbody>
            {details.map((item, index) => (
              <tr key={index} className="bg-white border-b hover:bg-gray-50">
                <td className="px-4 py-4">{formatCurrency(item.comissaoBruta)}</td>
                <td className="px-4 py-4">{formatCurrency(item.comissaoLiquida)}</td>
                <td className="px-4 py-4">{formatCurrency(item.dsrBruto)}</td>
                <td className="px-4 py-4">{formatCurrency(item.dsrLiquido)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="font-bold text-gray-800 bg-gray-100">
            <tr>
              <td className="px-4 py-3">Total: {formatCurrency(totals.totalComissaoBruta)}</td>
              <td className="px-4 py-3">Total: {formatCurrency(totals.totalComissaoLiquida)}</td>
              <td className="px-4 py-3">Total: {formatCurrency(totals.totalDsrBruto)}</td>
              <td className="px-4 py-3">Total: {formatCurrency(totals.totalDsrLiquido)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="text-right">
        <button
          onClick={handleExportCSV}
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
        >
          Exportar para CSV
        </button>
      </div>
    </div>
  );
};

export default ReportDisplay;

import React from 'react';

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

interface ReportDisplayProps {
  reportData: ReportData;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ reportData }) => {
  const hasDiscrepancy = reportData.difference !== 0;

  const handleExportCSV = () => {
    const headers = [
      'ID Colaborador',
      'Mês',
      'Total Comissões (R$)',
      'Dias Úteis',
      'Domingos e Feriados',
      'DSR Calculado (R$)',
      'DSR Pago (R$)',
      'Diferença (R$)',
    ];

    const values = [
      reportData.employeeId,
      reportData.month,
      reportData.totalCommission.toFixed(2),
      reportData.workingDays,
      reportData.sundaysAndHolidays,
      reportData.calculatedDSR.toFixed(2),
      reportData.paidDSR.toFixed(2),
      reportData.difference.toFixed(2),
    ];

    // CSV content: header row + value row
    const csvContent = [headers.join(','), values.join(',')].join('\\n');

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_dsr_${reportData.employeeId}_${reportData.month.replace('/', '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Relatório para: {reportData.employeeId}</h3>
        <span className="text-sm font-medium text-gray-500">{reportData.month}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* ... table body remains the same ... */}
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-3 font-medium text-gray-600">Total Comissões</td>
              <td className="px-4 py-3 text-right">R$ {reportData.totalCommission.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-600">Dias Úteis</td>
              <td className="px-4 py-3 text-right">{reportData.workingDays}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-600">Domingos e Feriados</td>
              <td className="px-4 py-3 text-right">{reportData.sundaysAndHolidays}</td>
            </tr>
            <tr className="font-bold">
              <td className="px-4 py-3 font-medium text-gray-800">DSR Calculado</td>
              <td className="px-4 py-3 text-right">R$ {reportData.calculatedDSR.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-600">DSR Pago (Holerite)</td>
              <td className="px-4 py-3 text-right">R$ {reportData.paidDSR.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {hasDiscrepancy && (
        <div className={`mt-4 p-4 rounded-lg ${reportData.difference > 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
          <p className="font-bold">Atenção: Divergência encontrada!</p>
          <p>Diferença de R$ {reportData.difference.toFixed(2)} {reportData.difference > 0 ? 'a favor do colaborador.' : ' paga a mais.'}</p>
        </div>
      )}

      <div className="mt-6 text-right">
        <button
          onClick={handleExportCSV}
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          Exportar para CSV
        </button>
      </div>
    </div>
  );
};

export default ReportDisplay;

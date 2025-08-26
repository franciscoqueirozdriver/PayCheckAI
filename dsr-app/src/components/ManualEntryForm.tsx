import React, { useState } from 'react';

// Define the type for the props, including the callback function
interface ManualEntryFormProps {
  onCalculate: (params: { totalCommission: number; workingDays: number; restDays: number; paidDSR: number }) => void;
}

const ManualEntryForm: React.FC<ManualEntryFormProps> = ({ onCalculate }) => {
  // State for each form field
  const [totalCommission, setTotalCommission] = useState('');
  const [workingDays, setWorkingDays] = useState('');
  const [restDays, setRestDays] = useState('');
  const [paidDSR, setPaidDSR] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Convert state strings to numbers and call the parent handler
    onCalculate({
      totalCommission: parseFloat(totalCommission) || 0,
      workingDays: parseInt(workingDays) || 0,
      restDays: parseInt(restDays) || 0,
      paidDSR: parseFloat(paidDSR) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="totalCommission" className="block text-sm font-medium text-gray-700">
          Valor Total das Comissões (R$)
        </label>
        <input
          type="number"
          name="totalCommission"
          id="totalCommission"
          value={totalCommission}
          onChange={(e) => setTotalCommission(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Ex: 1500.50"
          required
        />
      </div>
      <div>
        <label htmlFor="workingDays" className="block text-sm font-medium text-gray-700">
          Dias Úteis no Mês
        </label>
        <input
          type="number"
          name="workingDays"
          id="workingDays"
          value={workingDays}
          onChange={(e) => setWorkingDays(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Ex: 22"
          required
        />
      </div>
      <div>
        <label htmlFor="restDays" className="block text-sm font-medium text-gray-700">
          Dias de Descanso (Domingos + Feriados)
        </label>
        <input
          type="number"
          name="restDays"
          id="restDays"
          value={restDays}
          onChange={(e) => setRestDays(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Ex: 5"
          required
        />
      </div>
      <div>
        <label htmlFor="paidDSR" className="block text-sm font-medium text-gray-700">
          Valor do DSR Pago no Holerite (R$)
        </label>
        <input
          type="number"
          name="paidDSR"
          id="paidDSR"
          value={paidDSR}
          onChange={(e) => setPaidDSR(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Ex: 310.20"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Calcular DSR
      </button>
    </form>
  );
};

export default ManualEntryForm;

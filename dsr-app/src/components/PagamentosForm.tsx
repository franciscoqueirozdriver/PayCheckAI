import React from 'react';
import { PaymentRowWithId } from '../app/page'; // Import the type from page.tsx

interface PagamentosFormProps {
  payments: PaymentRowWithId[];
  setPayments: React.Dispatch<React.SetStateAction<PaymentRowWithId[]>>;
}

const PagamentosForm: React.FC<PagamentosFormProps> = ({ payments, setPayments }) => {

  const handleInputChange = (id: number, field: string, value: string) => {
    const newPayments = payments.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setPayments(newPayments);
  };

  const addPaymentRow = () => {
    const newId = payments.length > 0 ? Math.max(...payments.map(p => p.id)) + 1 : 1;
    setPayments([
      ...payments,
      { id: newId, valor_bruto: '', percentual_imposto: '', percentual_comissao: '' }
    ]);
  };

  const removePaymentRow = (id: number) => {
    const newPayments = payments.filter(p => p.id !== id);
    setPayments(newPayments);
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Pagamentos / Comissões</h2>
      <div className="space-y-4">
        {payments.map((payment, index) => (
          <div key={payment.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md relative pt-8">
            <div className="absolute top-2 left-4 text-sm font-bold text-gray-600">Pagamento #{index + 1}</div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Valor Bruto (R$)</label>
              <input
                type="text"
                value={payment.valor_bruto}
                onChange={(e) => handleInputChange(payment.id, 'valor_bruto', e.target.value)}
                className="mt-1 w-full p-2 border rounded-md shadow-sm"
                placeholder="5000,00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Imposto (%)</label>
              <input
                type="text"
                value={payment.percentual_imposto}
                onChange={(e) => handleInputChange(payment.id, 'percentual_imposto', e.target.value)}
                className="mt-1 w-full p-2 border rounded-md shadow-sm"
                placeholder="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Comissão (%)</label>
              <input
                type="text"
                value={payment.percentual_comissao}
                onChange={(e) => handleInputChange(payment.id, 'percentual_comissao', e.target.value)}
                className="mt-1 w-full p-2 border rounded-md shadow-sm"
                placeholder="5"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => removePaymentRow(payment.id)}
                className="w-full py-2 px-4 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-md shadow-sm transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={addPaymentRow}
        className="mt-4 w-full py-2 px-4 text-sm font-bold text-indigo-600 bg-indigo-100 hover:bg-indigo-200 rounded-md transition-colors"
      >
        + Adicionar Outro Pagamento
      </button>
    </section>
  );
};

export default PagamentosForm;

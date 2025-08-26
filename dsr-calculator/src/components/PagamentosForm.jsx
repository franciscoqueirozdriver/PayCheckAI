import React from 'react';

export default function PagamentosForm({ pagamentos, setPagamentos }) {
  const handleChange = (id, field, value) => {
    setPagamentos(pags => pags.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  const addPagamento = () => {
    setPagamentos(pags => [...pags, { id: Date.now(), valor_bruto: '', percentual_imposto: '', percentual_comissao: '' }]);
  };
  const removePagamento = (id) => {
    setPagamentos(pags => pags.filter(p => p.id !== id));
  };
  return (
    <div className="space-y-2 mb-4">
      {pagamentos.map(p => (
        <div key={p.id} className="flex space-x-2">
          <input
            className="border p-1 flex-1"
            placeholder="Valor Bruto"
            value={p.valor_bruto}
            onChange={e => handleChange(p.id, 'valor_bruto', e.target.value)}
          />
          <input
            className="border p-1 w-24"
            placeholder="% Imposto"
            value={p.percentual_imposto}
            onChange={e => handleChange(p.id, 'percentual_imposto', e.target.value)}
          />
          <input
            className="border p-1 w-24"
            placeholder="% Comissão"
            value={p.percentual_comissao}
            onChange={e => handleChange(p.id, 'percentual_comissao', e.target.value)}
          />
          <button type="button" className="bg-red-500 text-white px-2" onClick={() => removePagamento(p.id)}>Remover</button>
        </div>
      ))}
      <button type="button" className="bg-blue-500 text-white px-2" onClick={addPagamento}>Adicionar Pagamento</button>
    </div>
  );
}

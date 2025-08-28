'use client';

import React from 'react';
import { Payment, BasesSelecionadas } from '@/src/types/paycheckai';
import {
  calcLiquido,
  calcComissao,
  calcDSR,
  formatCurrencyBR,
} from '@/src/lib/paycheckai/data';

interface PaymentsTableProps {
  rows: Payment[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof Payment, value: any) => void;
  bases: BasesSelecionadas;
  locked: boolean;
  diasDescanso: number;
  diasUteisDivisor: number;
}

export default function PaymentsTable({
  rows,
  onAdd,
  onRemove,
  onChange,
  bases,
  locked,
  diasDescanso,
  diasUteisDivisor,
}: PaymentsTableProps) {
  const showComBr = bases.comissaoValorBruto;
  const showComLiq = bases.comissaoValorLiquido;
  const showDSRBr = bases.dsrValorBruto;
  const showDSRLiq = bases.dsrValorLiquido;

  let totalComBr = 0;
  let totalComLiq = 0;
  let totalDSRBr = 0;
  let totalDSRLiq = 0;

  return (
    <section className="p-4 bg-white shadow mb-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold">Lançamentos</h2>
        <button
          type="button"
          onClick={onAdd}
          className="bg-green-600 text-white px-3 py-1 rounded"
        >
          Adicionar Pagamento
        </button>
      </div>
      <div className="overflow-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="border p-1">Data de Pagamento</th>
              <th className="border p-1">Empresa</th>
              <th className="border p-1">Tipo</th>
              <th className="border p-1">Parcela</th>
              <th className="border p-1">Valor Bruto</th>
              <th className="border p-1">% Imposto</th>
              <th className="border p-1">Líquido da Venda</th>
              <th className="border p-1">% Comissão</th>
              {showComBr && <th className="border p-1">Comissão Bruta</th>}
              {showComLiq && <th className="border p-1">Comissão Líquida</th>}
              {showDSRBr && <th className="border p-1">DSR Bruto</th>}
              {showDSRLiq && <th className="border p-1">DSR Líquido</th>}
              <th className="border p-1">Status</th>
              <th className="border p-1"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const liquido = calcLiquido(row.valorBruto, row.percImposto);
              const comBr = calcComissao(row.valorBruto, row.percComissao);
              const comLiq = calcComissao(liquido, row.percComissao);
              const dsrBr = calcDSR(comBr, diasDescanso, diasUteisDivisor);
              const dsrLiq = calcDSR(comLiq, diasDescanso, diasUteisDivisor);

              if (showComBr) totalComBr += comBr;
              if (showComLiq) totalComLiq += comLiq;
              if (showDSRBr) totalDSRBr += dsrBr;
              if (showDSRLiq) totalDSRLiq += dsrLiq;

              return (
                <tr key={row.id} className="odd:bg-white even:bg-gray-50">
                  <td className="border p-1">
                    <input
                      type="date"
                      value={row.dataPagamento}
                      onChange={(e) => onChange(row.id, 'dataPagamento', e.target.value)}
                      className="border rounded p-1"
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      type="text"
                      value={row.empresa}
                      onChange={(e) => onChange(row.id, 'empresa', e.target.value)}
                      className="border rounded p-1"
                    />
                  </td>
                  <td className="border p-1">
                    <select
                      value={row.tipo}
                      onChange={(e) => onChange(row.id, 'tipo', e.target.value)}
                      className="border rounded p-1"
                    >
                      <option value="Mensalidade">Mensalidade</option>
                      <option value="Implantação">Implantação</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </td>
                  <td className="border p-1">
                    <input
                      type="text"
                      value={row.parcela}
                      onChange={(e) => onChange(row.id, 'parcela', e.target.value)}
                      className="border rounded p-1 w-24"
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      type="number"
                      value={row.valorBruto}
                      onChange={(e) =>
                        onChange(row.id, 'valorBruto', Number(e.target.value))
                      }
                      className="border rounded p-1 w-24"
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      type="number"
                      value={row.percImposto}
                      disabled={locked}
                      onChange={(e) =>
                        onChange(row.id, 'percImposto', Number(e.target.value))
                      }
                      className="border rounded p-1 w-20"
                    />
                  </td>
                  <td className="border p-1 text-right">
                    {formatCurrencyBR(liquido)}
                  </td>
                  <td className="border p-1">
                    <input
                      type="number"
                      value={row.percComissao}
                      disabled={locked}
                      onChange={(e) =>
                        onChange(row.id, 'percComissao', Number(e.target.value))
                      }
                      className="border rounded p-1 w-20"
                    />
                  </td>
                  {showComBr && (
                    <td className="border p-1 text-right">
                      {formatCurrencyBR(comBr)}
                    </td>
                  )}
                  {showComLiq && (
                    <td className="border p-1 text-right">
                      {formatCurrencyBR(comLiq)}
                    </td>
                  )}
                  {showDSRBr && (
                    <td className="border p-1 text-right">
                      {formatCurrencyBR(dsrBr)}
                    </td>
                  )}
                  {showDSRLiq && (
                    <td className="border p-1 text-right">
                      {formatCurrencyBR(dsrLiq)}
                    </td>
                  )}
                  <td className="border p-1">
                    <select
                      value={row.status}
                      onChange={(e) => onChange(row.id, 'status', e.target.value)}
                      className="border rounded p-1"
                    >
                      <option value="Previsto">Previsto</option>
                      <option value="Recebido">Recebido</option>
                    </select>
                  </td>
                  <td className="border p-1 text-center">
                    <button
                      type="button"
                      onClick={() => onRemove(row.id)}
                      className="text-red-600"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td className="border p-1" colSpan={8}>
                Totais
              </td>
              {showComBr && (
                <td className="border p-1 text-right">
                  {formatCurrencyBR(totalComBr)}
                </td>
              )}
              {showComLiq && (
                <td className="border p-1 text-right">
                  {formatCurrencyBR(totalComLiq)}
                </td>
              )}
              {showDSRBr && (
                <td className="border p-1 text-right">
                  {formatCurrencyBR(totalDSRBr)}
                </td>
              )}
              {showDSRLiq && (
                <td className="border p-1 text-right">
                  {formatCurrencyBR(totalDSRLiq)}
                </td>
              )}
              <td className="border p-1" colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

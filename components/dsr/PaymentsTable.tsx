'use client';

import React from 'react';
import { Payment, BasesSelecionadas } from '../../types/dsr';
import {
  calcLiquido,
  calcComissao,
  calcDSR,
  formatCurrencyBR,
  parseCurrencyBRL,
  formatNumberBRL,
} from '../../lib/dsr';

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

  // Shared styles for inputs
  const inputStyle = "w-full bg-transparent border-none rounded-md p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-75";
  const buttonStyle = "bg-success text-white rounded-lg px-4 py-2 text-sm font-semibold shadow-sm hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors";
  const thStyle = "p-3 text-left text-sm font-semibold text-muted-foreground";
  const tdStyle = "p-1 whitespace-nowrap";
  const tdNumericStyle = `${tdStyle} text-right font-mono`;

  return (
    <section className="bg-card text-card-foreground p-card-p rounded-2xl shadow-elevation-1">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-foreground">Lançamentos</h2>
        <button type="button" onClick={onAdd} className={buttonStyle}>
          Adicionar Pagamento
        </button>
      </div>
      <div className="overflow-auto border border-border rounded-lg">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className={thStyle}>Data</th>
              <th className={thStyle}>Empresa</th>
              <th className={thStyle}>Tipo</th>
              <th className={thStyle}>Parcela</th>
              <th className={`${thStyle} text-right`}>Valor Bruto</th>
              <th className={`${thStyle} text-right`}>% Imposto</th>
              <th className={`${thStyle} text-right`}>Líquido</th>
              <th className={`${thStyle} text-right`}>% Comissão</th>
              {showComBr && <th className={`${thStyle} text-right`}>Comissão Bruta</th>}
              {showComLiq && <th className={`${thStyle} text-right`}>Comissão Líquida</th>}
              {showDSRBr && <th className={`${thStyle} text-right`}>DSR Bruto</th>}
              {showDSRLiq && <th className={`${thStyle} text-right`}>DSR Líquido</th>}
              <th className={thStyle}>Status</th>
              <th className={thStyle}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
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
                <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                  <td className={tdStyle}>
                    <input type="date" value={row.dataPagamento} onChange={(e) => onChange(row.id, 'dataPagamento', e.target.value)} className={inputStyle} />
                  </td>
                  <td className={tdStyle}>
                    <input type="text" value={row.empresa} onChange={(e) => onChange(row.id, 'empresa', e.target.value)} className={inputStyle} placeholder="Nome da empresa"/>
                  </td>
                  <td className={tdStyle}>
                    <select value={row.tipo} onChange={(e) => onChange(row.id, 'tipo', e.target.value)} className={inputStyle}>
                      <option value="Mensalidade">Mensalidade</option>
                      <option value="Implantação">Implantação</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </td>
                  <td className={tdStyle}>
                    <input type="text" value={row.parcela} onChange={(e) => onChange(row.id, 'parcela', e.target.value)} className={`${inputStyle} w-24`} placeholder="Ex: 1 de 6"/>
                  </td>
                  <td className={tdNumericStyle}>
                    <input
                      type="text"
                      value={formatNumberBRL(row.valorBruto)}
                      onChange={(e) => {
                        const numericValue = parseCurrencyBRL(e.target.value);
                        onChange(row.id, 'valorBruto', numericValue);
                      }}
                      className={`${inputStyle} text-right`}
                      placeholder="0,00"
                    />
                  </td>
                  <td className={tdNumericStyle}>
                    <input type="number" value={row.percImposto} disabled={locked} onChange={(e) => onChange(row.id, 'percImposto', Number(e.target.value))} className={`${inputStyle} w-20 text-right`} />
                  </td>
                  <td className={tdNumericStyle}>{formatCurrencyBR(liquido)}</td>
                  <td className={tdNumericStyle}>
                    <input type="number" value={row.percComissao} disabled={locked} onChange={(e) => onChange(row.id, 'percComissao', Number(e.target.value))} className={`${inputStyle} w-20 text-right`} />
                  </td>
                  {showComBr && <td className={tdNumericStyle}>{formatCurrencyBR(comBr)}</td>}
                  {showComLiq && <td className={tdNumericStyle}>{formatCurrencyBR(comLiq)}</td>}
                  {showDSRBr && <td className={tdNumericStyle}>{formatCurrencyBR(dsrBr)}</td>}
                  {showDSRLiq && <td className={tdNumericStyle}>{formatCurrencyBR(dsrLiq)}</td>}
                  <td className={tdStyle}>
                    <select value={row.status} onChange={(e) => onChange(row.id, 'status', e.target.value)} className={inputStyle}>
                      <option value="Previsto">Previsto</option>
                      <option value="Recebido">Recebido</option>
                    </select>
                  </td>
                  <td className={`${tdStyle} text-center`}>
                    <button type="button" onClick={() => onRemove(row.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-muted/50 border-t-2 border-border">
            <tr className="font-semibold">
              <td className={`${thStyle} text-right`} colSpan={8}>Totais</td>
              {showComBr && <td className={tdNumericStyle}>{formatCurrencyBR(totalComBr)}</td>}
              {showComLiq && <td className={tdNumericStyle}>{formatCurrencyBR(totalComLiq)}</td>}
              {showDSRBr && <td className={tdNumericStyle}>{formatCurrencyBR(totalDSRBr)}</td>}
              {showDSRLiq && <td className={tdNumericStyle}>{formatCurrencyBR(totalDSRLiq)}</td>}
              <td className={thStyle} colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

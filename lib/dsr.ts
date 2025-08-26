// Funções puras de cálculo de DSR e formatação
import { Payment } from '../types/dsr';

export function calcLiquido(valorBruto: number, percImposto: number): number {
  return valorBruto * (1 - percImposto / 100);
}

export function calcComissao(valorBase: number, percComissao: number): number {
  return valorBase * (percComissao / 100);
}

export function calcDSR(
  comissao: number,
  diasDescanso: number,
  diasUteisDivisor: number
): number {
  if (diasUteisDivisor === 0) return 0;
  return comissao * (diasDescanso / diasUteisDivisor);
}

export function formatCurrencyBR(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function applyGlobalRatesToRows(
  rows: Payment[],
  aliquotas: { imposto: number; comissao: number }
): Payment[] {
  return rows.map((r) => ({
    ...r,
    percImposto: aliquotas.imposto,
    percComissao: aliquotas.comissao,
  }));
}

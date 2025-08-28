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

/**
 * Converts a BRL currency string (e.g., "1.234,56") to a number.
 * @param value The string to parse.
 * @returns A number representing the value.
 */
export function parseCurrencyBRL(value: string): number {
  if (!value) return 0;
  // Remove thousand separators and replace decimal comma with a period
  const sanitized = value.replace(/\./g, '').replace(',', '.');
  const number = parseFloat(sanitized);
  return isNaN(number) ? 0 : number;
}

/**
 * Formats a number into a BRL currency string without the "R$" symbol.
 * @param value The number to format.
 * @returns A formatted string (e.g., "1.234,56").
 */
export function formatNumberBRL(value: number): string {
  if (isNaN(value)) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

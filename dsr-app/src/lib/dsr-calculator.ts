// Helper function to parse currency strings (e.g., "R$ 1.234,56") into numbers.
export function parseCurrency(valor: string | number): number {
  if (typeof valor === 'number') return valor;
  if (!valor || typeof valor !== 'string') return 0;

  const numeroLimpo = valor
    .replace(/R\$\s?/, '') // Remove "R$" symbol
    .replace(/\./g, '')      // Remove thousand separators
    .replace(',', '.');      // Replace decimal comma with a dot

  return parseFloat(numeroLimpo) || 0;
}

// Helper function to format numbers back into Brazilian currency strings.
export function formatCurrency(valor: number): string {
  return (valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

// Interface for a single payment row
export interface PaymentRow {
  valor_bruto: string | number;
  percentual_imposto: string | number;
  percentual_comissao: string | number;
}

// Interface for the day counts
export interface DayCounts {
  usarComSabado: boolean;
  diasComSabado: number;
  diasSemSabado: number;
  diasDescanso: number;
}

// Calculates DSR for a single payment, considering gross vs. net values.
export function calcularDSRporPagamento(row: PaymentRow, days: DayCounts) {
  const valorBruto = parseCurrency(row.valor_bruto);
  const percentualImposto = parseFloat(String(row.percentual_imposto)) || 0;
  const percentualComissao = parseFloat(String(row.percentual_comissao)) || 0;

  // Calculate net value after tax
  const liquidoVenda = valorBruto * (1 - percentualImposto / 100);

  // Calculate commission based on both gross and net sale value
  const comissaoBruta = valorBruto * (percentualComissao / 100);
  const comissaoLiquida = liquidoVenda * (percentualComissao / 100);

  // Determine the divisor based on whether Saturday is a working day
  const divisor = days.usarComSabado ? days.diasComSabado : days.diasSemSabado;

  // Calculate DSR on both gross and net commission
  const dsrBruto = divisor > 0 ? (comissaoBruta / divisor) * days.diasDescanso : 0;
  const dsrLiquido = divisor > 0 ? (comissaoLiquida / divisor) * days.diasDescanso : 0;

  return {
    liquidoVenda,
    comissaoBruta,
    comissaoLiquida,
    dsrBruto,
    dsrLiquido
  };
}

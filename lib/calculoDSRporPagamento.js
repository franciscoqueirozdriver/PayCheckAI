/**
 * Parses a monetary value, converting it from a string or number to a float.
 * Handles different decimal separators.
 * @param {string|number} value - The value to parse.
 * @returns {number} - The parsed float value.
 */
export const parseValor = (value) => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    // Replace comma with dot for decimal conversion and remove thousands separators
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  }
  return 0.0;
};

/**
 * Calculates DSR and other related values for a single payment line.
 * @param {object} pagamento - The payment object from the API.
 * @param {number} diasUteis - Total working days in the month.
 * @param {number} diasDescanso - Total rest days (Sundays + holidays) in the month.
 * @returns {object} - An object with all calculated values.
 */
export const calcularDSRporPagamento = (pagamento, diasUteis, diasDescanso) => {
  const comissaoBruta = parseValor(pagamento.valor_bruto);
  const percImposto = parseValor(pagamento.percentual_imposto) / 100;

  const imposto = comissaoBruta * percImposto;
  const comissaoLiquida = comissaoBruta - imposto;

  let dsr = 0;
  if (diasUteis > 0) {
    // The core DSR calculation formula
    dsr = (comissaoBruta / diasUteis) * diasDescanso;
  }

  const dsrLiquido = dsr * (1 - percImposto);
  const totalBruto = comissaoBruta + dsr;
  const totalLiquido = comissaoLiquida + dsrLiquido;

  return {
    ...pagamento,
    comissaoBruta: comissaoBruta.toFixed(2),
    imposto: imposto.toFixed(2),
    comissaoLiquida: comissaoLiquida.toFixed(2),
    dsr: dsr.toFixed(2),
    dsrLiquido: dsrLiquido.toFixed(2),
    totalBruto: totalBruto.toFixed(2),
    totalLiquido: totalLiquido.toFixed(2),
  };
};

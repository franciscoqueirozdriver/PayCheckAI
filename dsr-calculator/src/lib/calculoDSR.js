export function parseNumber(value) {
  if (typeof value === 'number') return value;
  return parseFloat(String(value).replace(/\./g, '').replace(',', '.')) || 0;
}

export function calcularDSRporPagamento(pagamento, {
  usarComSabado,
  diasComSabado,
  diasSemSabado,
  diasDescanso
}) {
  const base = parseNumber(pagamento.valor_bruto);
  const percImposto = parseNumber(pagamento.percentual_imposto) / 100;
  const percComissao = parseNumber(pagamento.percentual_comissao) / 100;

  const liquidoVenda = base;
  const comissaoBruta = base * percComissao;
  const comissaoLiquida = comissaoBruta * (1 - percImposto);

  const divisor = usarComSabado ? diasComSabado : diasSemSabado;
  const dsrBruto = divisor ? (comissaoBruta / divisor) * diasDescanso : 0;
  const dsrLiquido = dsrBruto * (1 - percImposto);

  return { liquidoVenda, comissaoBruta, comissaoLiquida, dsrBruto, dsrLiquido };
}

export function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}


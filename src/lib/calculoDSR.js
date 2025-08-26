export function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function calcularDSRporPagamento(pagamento, {
  usarComSabado,
  diasComSabado,
  diasSemSabado,
  diasDescanso,
}) {
  const valorBruto = parseFloat((pagamento.valor_bruto || '0').replace(',', '.')) || 0;
  const percImposto = parseFloat((pagamento.percentual_imposto || '0').replace(',', '.')) || 0;
  const percComissao = parseFloat((pagamento.percentual_comissao || '0').replace(',', '.')) || 0;

  const liquidoVenda = valorBruto * (1 - percImposto / 100);
  const comissaoBruta = valorBruto * (percComissao / 100);
  const comissaoLiquida = comissaoBruta * (1 - percImposto / 100);
  const divisor = usarComSabado ? diasComSabado : diasSemSabado;
  const dsrBruto = divisor ? (comissaoBruta / divisor) * diasDescanso : 0;
  const dsrLiquido = divisor ? (comissaoLiquida / divisor) * diasDescanso : 0;

  return { liquidoVenda, comissaoBruta, comissaoLiquida, dsrBruto, dsrLiquido };
}

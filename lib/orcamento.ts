export function calcOrcamentoSubtotal(
  itens: Array<{ quantidade: number; precoUnitario: number }>
) {
  return itens.reduce((sum, item) => sum + item.quantidade * item.precoUnitario, 0);
}

export function calcOrcamentoTotal(
  itens: Array<{ quantidade: number; precoUnitario: number }>,
  desconto = 0,
  valorFinal?: number | null
) {
  const subtotal = calcOrcamentoSubtotal(itens);

  if (valorFinal != null && valorFinal >= 0) {
    return valorFinal;
  }

  return subtotal - subtotal * (desconto / 100);
}

/** Desconto em R$ quando o orçamento usa valor de pacote negociado. */
export function calcDescontoPacote(subtotal: number, valorFinal: number) {
  return Math.max(0, subtotal - valorFinal);
}

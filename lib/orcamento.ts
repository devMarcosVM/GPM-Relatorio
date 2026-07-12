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

export function validateDescontoInput(
  value: string
):
  | { valid: true; desconto: number; display: string }
  | { valid: false; message: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, message: "Informe o desconto (%)" };
  }

  const parsed = parseFloat(trimmed.replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return { valid: false, message: "Valor inválido" };
  }

  if (parsed < 0) {
    return { valid: false, message: "Mínimo de 0%" };
  }

  if (parsed > 100) {
    return { valid: false, message: "Máximo de 100%" };
  }

  const display = Number.isInteger(parsed)
    ? String(parsed)
    : parsed.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

  return { valid: true, desconto: parsed, display };
}

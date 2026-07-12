export type UnidadeServico = "UNIDADE" | "METRO";

export const UNIDADES_SERVICO = [
  { value: "UNIDADE" as const, label: "Por unidade (serviço fixo)" },
  { value: "METRO" as const, label: "Por metro (R$/m)" },
];

export function normalizeUnidade(value?: string | null): UnidadeServico {
  return value === "METRO" ? "METRO" : "UNIDADE";
}

export function getQuantidadeMin(unidade: UnidadeServico): number {
  return unidade === "METRO" ? 0.1 : 1;
}

export function getQuantidadeInicial(unidade: UnidadeServico): number {
  return 1;
}

export function getQuantidadeStep(unidade: UnidadeServico): number {
  return unidade === "METRO" ? 0.1 : 1;
}

export function clampQuantidade(
  quantidade: number,
  unidade: UnidadeServico
): number {
  const min = getQuantidadeMin(unidade);
  const step = getQuantidadeStep(unidade);
  const clamped = Math.max(min, quantidade);
  return Math.round(clamped / step) * step;
}

export function parseQuantidade(
  value: string | number,
  unidade: UnidadeServico
): number {
  const parsed =
    typeof value === "number"
      ? value
      : parseFloat(String(value).replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return getQuantidadeMin(unidade);
  }
  return clampQuantidade(parsed, unidade);
}

export function validateQuantidadeInput(
  value: string,
  unidade: UnidadeServico
):
  | { valid: true; quantidade: number; display: string }
  | { valid: false; message: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      valid: false,
      message:
        unidade === "METRO"
          ? "Informe quantos metros serão cobrados"
          : "Informe a quantidade",
    };
  }

  const parsed = parseFloat(trimmed.replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return { valid: false, message: "Valor inválido" };
  }

  const min = getQuantidadeMin(unidade);
  if (parsed < min) {
    return {
      valid: false,
      message:
        unidade === "METRO"
          ? `Mínimo de ${min.toLocaleString("pt-BR")} m`
          : `Mínimo de ${min}`,
    };
  }

  const quantidade = clampQuantidade(parsed, unidade);
  const display = Number.isInteger(quantidade)
    ? String(quantidade)
    : quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  return { valid: true, quantidade, display };
}

export function formatQuantidadeInput(
  quantidade: number,
  unidade: UnidadeServico
): string {
  if (unidade === "METRO" && !Number.isInteger(quantidade)) {
    return quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  }
  return String(quantidade);
}
export function formatQuantidade(
  quantidade: number,
  unidade: UnidadeServico
): string {
  if (unidade === "METRO") {
    const formatted = Number.isInteger(quantidade)
      ? String(quantidade)
      : quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
    return `${formatted} m`;
  }
  const formatted = Number.isInteger(quantidade)
    ? String(quantidade)
    : quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  return formatted;
}

export function formatPrecoUnitario(
  preco: number,
  unidade: UnidadeServico
): string {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(preco);
  return unidade === "METRO" ? `${formatted}/m` : formatted;
}

export function getQuantidadeLabel(unidade: UnidadeServico): string {
  return unidade === "METRO" ? "Metros" : "Qtd";
}

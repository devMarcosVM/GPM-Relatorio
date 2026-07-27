import type { UnidadeServico } from "./unidade";

const STORAGE_KEY = "campo-calculadora-historico";
const MAX_HISTORICO = 3;

export interface ItemCalcHistorico {
  servicoId: string;
  servicoNome: string;
  unidade: UnidadeServico;
  quantidade: number;
  precoUnitario: number;
  precoCatalogo: number;
}

export interface CalculoSalvo {
  id: string;
  savedAt: string;
  itens: ItemCalcHistorico[];
  desconto: number;
  valorFinalPacote: string;
  subtotal: number;
  total: number;
}

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function listarHistoricoCalculadora(): CalculoSalvo[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CalculoSalvo[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_HISTORICO);
  } catch {
    return [];
  }
}

export function salvarCalculoNoHistorico(
  calculo: Omit<CalculoSalvo, "id" | "savedAt">
): CalculoSalvo[] {
  if (!canUseStorage()) return [];

  const entry: CalculoSalvo = {
    ...calculo,
    id: `${Date.now()}`,
    savedAt: new Date().toISOString(),
  };

  const atual = listarHistoricoCalculadora().filter(
    (item) =>
      !(
        item.total === entry.total &&
        item.subtotal === entry.subtotal &&
        item.desconto === entry.desconto &&
        item.valorFinalPacote === entry.valorFinalPacote &&
        JSON.stringify(item.itens) === JSON.stringify(entry.itens)
      )
  );

  const next = [entry, ...atual].slice(0, MAX_HISTORICO);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function removerCalculoDoHistorico(id: string): CalculoSalvo[] {
  if (!canUseStorage()) return [];
  const next = listarHistoricoCalculadora().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function limparHistoricoCalculadora() {
  if (!canUseStorage()) return;
  localStorage.removeItem(STORAGE_KEY);
}

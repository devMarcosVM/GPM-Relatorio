import {
  buildAssinaturaUrl,
  buildAssinaturaWhatsAppMessage,
} from "./assinaturaLink";

export async function regenerarTokenOrcamento(id: string): Promise<string> {
  const res = await fetch(`/api/orcamentos/${id}/link-assinatura`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Erro ao gerar link");
  }
  return data.tokenAssinatura as string;
}

export async function regenerarTokenRelatorio(id: string): Promise<string> {
  const res = await fetch(`/api/relatorios/${id}/link-assinatura`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Erro ao gerar link");
  }
  return data.tokenAssinatura as string;
}

export async function obterTokenOrcamento(
  id: string,
  tokenAtual: string | null | undefined
): Promise<string> {
  if (tokenAtual) return tokenAtual;
  return regenerarTokenOrcamento(id);
}

export function copiarLinkAssinatura(token: string): Promise<void> {
  const url = buildAssinaturaUrl(token, window.location.origin);
  return navigator.clipboard.writeText(url);
}

export function enviarWhatsAppAssinatura(opts: {
  telefone: string;
  tipo: "relatorio" | "orcamento";
  numero: number;
  nomeCliente: string;
  token: string;
  total?: string;
}) {
  const phone = opts.telefone.replace(/\D/g, "");
  if (!phone) throw new Error("Cliente sem telefone cadastrado");

  const texto = buildAssinaturaWhatsAppMessage({
    tipo: opts.tipo,
    numero: opts.numero,
    nomeCliente: opts.nomeCliente,
    token: opts.token,
    origin: window.location.origin,
    total: opts.total,
  });

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(texto)}`, "_blank");
}

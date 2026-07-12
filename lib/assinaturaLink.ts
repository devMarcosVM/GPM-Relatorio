import { randomBytes } from "crypto";

const DIAS_VALIDADE = 7;

export function generateAssinaturaToken(): string {
  return randomBytes(32).toString("hex");
}

export function getAssinaturaExpiry(days = DIAS_VALIDADE): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export function buildAssinaturaUrl(token: string, origin?: string): string {
  const base = (origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  return `${base}/assinar/${token}`;
}

export function buildAssinaturaWhatsAppMessage(opts: {
  tipo: "relatorio" | "orcamento";
  numero: number;
  nomeCliente: string;
  token: string;
  origin?: string;
  total?: string;
}): string {
  const link = buildAssinaturaUrl(opts.token, opts.origin);
  const label = opts.tipo === "relatorio" ? "Relatorio de Servico" : "Orcamento";
  const num = String(opts.numero).padStart(4, "0");

  const lines = [
    `Ola, ${opts.nomeCliente}!`,
    "",
    `${label} #${num}${opts.total ? ` - ${opts.total}` : ""}`,
    "",
    "Assine pelo link:",
    link,
    "",
    "Se o link nao ficar azul, copie e cole no navegador.",
    `Valido por ${DIAS_VALIDADE} dias.`,
  ];

  return lines.join("\n");
}

export function isIpUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return (
      /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
      host.startsWith("100.") ||
      host.endsWith(".ts.net")
    );
  } catch {
    return false;
  }
}

export function isTokenExpirado(expira: Date | null | undefined): boolean {
  if (!expira) return true;
  return expira.getTime() < Date.now();
}

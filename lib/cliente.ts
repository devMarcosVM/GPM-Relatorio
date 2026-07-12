import {
  apenasDigitos,
  mensagemErroDocumento,
  mensagemErroTelefone,
  normalizarDocumento,
  normalizarTelefone,
} from "./documentosBr";
import { prisma } from "./db";

export interface ClienteFormData {
  nome: string;
  documento?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
}

export interface ClienteDbPayload extends ClienteFormData {
  documentoDigits: string | null;
}

export function documentoDigitsFrom(value?: string | null): string | null {
  const digits = apenasDigitos(value || "");
  return digits.length > 0 ? digits : null;
}

export function validateCliente(data: ClienteFormData): string | null {
  if (!data.nome?.trim()) return "Nome é obrigatório";

  const docError = mensagemErroDocumento(data.documento || "");
  if (docError) return docError;

  const telError = mensagemErroTelefone(data.telefone || "");
  if (telError) return telError;

  const email = data.email?.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "E-mail inválido";
  }

  return null;
}

export function normalizeClientePayload(data: ClienteFormData): ClienteDbPayload {
  const documento = normalizarDocumento(data.documento);
  return {
    nome: data.nome.trim(),
    documento,
    documentoDigits: documentoDigitsFrom(documento),
    telefone: normalizarTelefone(data.telefone),
    email: data.email?.trim().toLowerCase() || null,
    endereco: data.endereco?.trim() || null,
  };
}

export async function mensagemDocumentoDuplicado(
  documento: string | null,
  documentoDigits: string | null,
  excludeId?: string
): Promise<string | null> {
  if (!documentoDigits) return null;

  const existing = await prisma.cliente.findFirst({
    where: {
      documentoDigits,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { nome: true },
  });

  if (existing) {
    return `Já existe um cliente com este CPF/CNPJ: ${existing.nome}`;
  }

  const legacy = await prisma.cliente.findMany({
    where: {
      documentoDigits: null,
      documento: { not: null },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { nome: true, documento: true },
  });

  for (const cliente of legacy) {
    if (documentoDigitsFrom(cliente.documento) === documentoDigits) {
      return `Já existe um cliente com este CPF/CNPJ: ${cliente.nome}`;
    }
  }

  return null;
}

export function mensagemErroClienteDuplicado(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return "Já existe um cliente cadastrado com este CPF/CNPJ";
  }
  return null;
}

import {
  mensagemErroDocumento,
  mensagemErroTelefone,
  normalizarDocumento,
  normalizarTelefone,
} from "./documentosBr";

export interface ClienteFormData {
  nome: string;
  documento?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
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

export function normalizeClientePayload(data: ClienteFormData): ClienteFormData {
  return {
    nome: data.nome.trim(),
    documento: normalizarDocumento(data.documento),
    telefone: normalizarTelefone(data.telefone),
    email: data.email?.trim().toLowerCase() || null,
    endereco: data.endereco?.trim() || null,
  };
}

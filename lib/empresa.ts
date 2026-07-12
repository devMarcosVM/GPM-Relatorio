import {
  formatCnpj,
  formatTelefone,
  mensagemErroTelefone,
  normalizarTelefone,
  validarCnpj,
} from "./documentosBr";

export interface EmpresaData {
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
  logoUrl?: string | null;
}

export function isEmpresaConfigured(empresa: EmpresaData | null | undefined): boolean {
  if (!empresa) return false;
  return Boolean(
    empresa.razaoSocial?.trim() &&
      empresa.cnpj?.trim() &&
      empresa.endereco?.trim() &&
      empresa.telefone?.trim() &&
      empresa.email?.trim()
  );
}

export { formatCnpj, formatTelefone };

export function validateEmpresa(data: EmpresaData): string | null {
  if (!data.razaoSocial?.trim()) return "Razão social é obrigatória";
  if (!data.cnpj?.trim()) return "CNPJ é obrigatório";
  if (!validarCnpj(data.cnpj)) return "CNPJ inválido";
  if (!data.endereco?.trim()) return "Endereço é obrigatório";
  if (!data.telefone?.trim()) return "Telefone é obrigatório";

  const telError = mensagemErroTelefone(data.telefone);
  if (telError) return telError;

  if (!data.email?.trim()) return "E-mail é obrigatório";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    return "E-mail inválido";
  }
  return null;
}

export function normalizeEmpresaPayload(data: EmpresaData): EmpresaData {
  return {
    razaoSocial: data.razaoSocial.trim(),
    cnpj: formatCnpj(data.cnpj),
    endereco: data.endereco.trim(),
    telefone: normalizarTelefone(data.telefone) || "",
    email: data.email.trim().toLowerCase(),
    logoUrl: data.logoUrl?.trim() || null,
  };
}

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

export function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function validateEmpresa(data: EmpresaData): string | null {
  if (!data.razaoSocial?.trim()) return "Razão social é obrigatória";
  if (!data.cnpj?.trim()) return "CNPJ é obrigatório";
  if (data.cnpj.replace(/\D/g, "").length !== 14) return "CNPJ deve ter 14 dígitos";
  if (!data.endereco?.trim()) return "Endereço é obrigatório";
  if (!data.telefone?.trim()) return "Telefone é obrigatório";
  if (!data.email?.trim()) return "E-mail é obrigatório";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    return "E-mail inválido";
  }
  return null;
}

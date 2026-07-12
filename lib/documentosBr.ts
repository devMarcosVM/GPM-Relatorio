export type TipoDocumento = "CPF" | "CNPJ";

const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;
const TELEFONE_MIN = 10;
const TELEFONE_MAX = 11;

/** Remove tudo que não for dígito. */
export function apenasDigitos(value: string): string {
  return value.replace(/\D/g, "");
}

/** Detecta CPF ou CNPJ pelo tamanho dos dígitos. */
export function detectarTipoDocumento(value: string): TipoDocumento | null {
  const digits = apenasDigitos(value);
  if (digits.length === 0) return null;
  if (digits.length <= CPF_LENGTH) return "CPF";
  return "CNPJ";
}

/** Formata CPF: 000.000.000-00 */
export function formatCpf(value: string): string {
  const digits = apenasDigitos(value).slice(0, CPF_LENGTH);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

/** Formata CNPJ: 00.000.000/0000-00 */
export function formatCnpj(value: string): string {
  const digits = apenasDigitos(value).slice(0, CNPJ_LENGTH);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/** Formata CPF ou CNPJ conforme a quantidade de dígitos digitada. */
export function formatDocumento(value: string): string {
  const digits = apenasDigitos(value);
  if (digits.length <= CPF_LENGTH) return formatCpf(value);
  return formatCnpj(value);
}

/**
 * Formata telefone brasileiro:
 * - (11) 3333-4444 — fixo, 10 dígitos
 * - (11) 98765-4321 — celular, 11 dígitos
 */
export function formatTelefone(value: string): string {
  let digits = apenasDigitos(value);

  if (digits.startsWith("55") && digits.length > TELEFONE_MAX) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, TELEFONE_MAX);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function temDigitosRepetidos(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

function calcularDigitoCpf(base: string, pesoInicial: number): number {
  const sum = base
    .split("")
    .reduce((acc, digit, index) => acc + Number(digit) * (pesoInicial - index), 0);
  const rest = (sum * 10) % 11;
  return rest === 10 ? 0 : rest;
}

/** Valida CPF com dígitos verificadores. */
export function validarCpf(value: string): boolean {
  const digits = apenasDigitos(value);
  if (digits.length !== CPF_LENGTH) return false;
  if (temDigitosRepetidos(digits)) return false;

  const d1 = calcularDigitoCpf(digits.slice(0, 9), 10);
  if (d1 !== Number(digits[9])) return false;

  const d2 = calcularDigitoCpf(digits.slice(0, 10), 11);
  return d2 === Number(digits[10]);
}

function calcularDigitoCnpj(base: string, pesos: number[]): number {
  const sum = base
    .split("")
    .reduce((acc, digit, index) => acc + Number(digit) * pesos[index], 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

/** Valida CNPJ com dígitos verificadores. */
export function validarCnpj(value: string): boolean {
  const digits = apenasDigitos(value);
  if (digits.length !== CNPJ_LENGTH) return false;
  if (temDigitosRepetidos(digits)) return false;

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calcularDigitoCnpj(digits.slice(0, 12), pesos1);
  if (d1 !== Number(digits[12])) return false;

  const d2 = calcularDigitoCnpj(digits.slice(0, 13), pesos2);
  return d2 === Number(digits[13]);
}

/** Valida CPF ou CNPJ conforme o tamanho. */
export function validarDocumento(value: string): boolean {
  const tipo = detectarTipoDocumento(value);
  if (tipo === "CPF") return validarCpf(value);
  if (tipo === "CNPJ") return validarCnpj(value);
  return false;
}

/** Valida telefone brasileiro (10 ou 11 dígitos, DDD 11–99). */
export function validarTelefone(value: string): boolean {
  let digits = apenasDigitos(value);
  if (digits.startsWith("55") && digits.length > TELEFONE_MAX) {
    digits = digits.slice(2);
  }

  if (digits.length < TELEFONE_MIN || digits.length > TELEFONE_MAX) {
    return false;
  }

  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;

  if (digits.length === TELEFONE_MAX && digits[2] !== "9") {
    return false;
  }

  return true;
}

export function mensagemErroDocumento(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const digits = apenasDigitos(trimmed);
  const tipo = detectarTipoDocumento(trimmed);

  if (tipo === "CPF") {
    if (digits.length !== CPF_LENGTH) return "CPF deve ter 11 dígitos";
    if (!validarCpf(trimmed)) return "CPF inválido";
    return null;
  }

  if (digits.length !== CNPJ_LENGTH) return "CNPJ deve ter 14 dígitos";
  if (!validarCnpj(trimmed)) return "CNPJ inválido";
  return null;
}

export function mensagemErroTelefone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!validarTelefone(trimmed)) {
    return "Telefone inválido. Use (DD) 9XXXX-XXXX ou (DD) XXXX-XXXX";
  }
  return null;
}

/** Normaliza documento para armazenamento formatado (idempotente). */
export function normalizarDocumento(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return formatDocumento(trimmed);
}

/** Normaliza telefone para armazenamento formatado (idempotente). */
export function normalizarTelefone(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return formatTelefone(trimmed);
}

/** Alias explícito: entrada com ou sem pontuação → mesmo formato final. */
export const padronizarDocumento = normalizarDocumento;
export const padronizarTelefone = normalizarTelefone;

/** Aplica máscara ao digitar ou ao sair do campo. */
export function aplicarMascaraDocumento(value: string): string {
  return formatDocumento(value);
}

export function aplicarMascaraTelefone(value: string): string {
  return formatTelefone(value);
}

/** Dígitos do telefone para WhatsApp (com DDI 55 quando ausente). */
export function telefoneParaWhatsApp(value: string): string {
  let digits = apenasDigitos(value);
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === TELEFONE_MIN || digits.length === TELEFONE_MAX) {
    return `55${digits}`;
  }
  return digits;
}

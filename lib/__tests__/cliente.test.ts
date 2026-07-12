import { describe, expect, it } from "vitest";
import {
  normalizeClientePayload,
  validateCliente,
  documentoDigitsFrom,
} from "../cliente";

const CPF_VALIDO = "529.982.247-25";
const TELEFONE_VALIDO = "(11) 98765-4321";

describe("validateCliente", () => {
  it("exige nome", () => {
    expect(validateCliente({ nome: "" })).toBe("Nome é obrigatório");
    expect(validateCliente({ nome: "   " })).toBe("Nome é obrigatório");
  });

  it("aceita cliente mínimo só com nome", () => {
    expect(validateCliente({ nome: "João Silva" })).toBeNull();
  });

  it("valida CPF quando informado", () => {
    expect(
      validateCliente({ nome: "João", documento: "111.111.111-11" })
    ).toBe("CPF inválido");
    expect(
      validateCliente({ nome: "João", documento: CPF_VALIDO })
    ).toBeNull();
    expect(
      validateCliente({ nome: "João", documento: "52998224725" })
    ).toBeNull();
  });

  it("valida CNPJ quando informado", () => {
    expect(
      validateCliente({ nome: "Empresa", documento: "11.444.777/0001-61" })
    ).toBeNull();
    expect(
      validateCliente({ nome: "Empresa", documento: "11444777000161" })
    ).toBeNull();
    expect(
      validateCliente({ nome: "Empresa", documento: "11.444.777/0001-60" })
    ).toBe("CNPJ inválido");
  });

  it("valida telefone quando informado", () => {
    expect(
      validateCliente({ nome: "João", telefone: "123" })
    ).toContain("Telefone inválido");
    expect(
      validateCliente({ nome: "João", telefone: TELEFONE_VALIDO })
    ).toBeNull();
    expect(
      validateCliente({ nome: "João", telefone: "11987654321" })
    ).toBeNull();
  });

  it("valida e-mail quando informado", () => {
    expect(
      validateCliente({ nome: "João", email: "invalido" })
    ).toBe("E-mail inválido");
    expect(
      validateCliente({ nome: "João", email: "joao@email.com" })
    ).toBeNull();
  });
});

describe("normalizeClientePayload", () => {
  it("formata documento e telefone", () => {
    const result = normalizeClientePayload({
      nome: "  Maria  ",
      documento: "52998224725",
      telefone: "11987654321",
      email: "MARIA@EMAIL.COM",
      endereco: "  Rua A  ",
    });

    expect(result).toEqual({
      nome: "Maria",
      documento: CPF_VALIDO,
      documentoDigits: "52998224725",
      telefone: TELEFONE_VALIDO,
      email: "maria@email.com",
      endereco: "Rua A",
    });
  });

  it("padroniza com ou sem pontuação na entrada", () => {
    const semPontuacao = normalizeClientePayload({
      nome: "Cliente",
      documento: "52998224725",
      telefone: "11 98765-4321",
    });
    const comPontuacao = normalizeClientePayload({
      nome: "Cliente",
      documento: CPF_VALIDO,
      telefone: TELEFONE_VALIDO,
    });

    expect(semPontuacao.documento).toBe(CPF_VALIDO);
    expect(semPontuacao.documentoDigits).toBe("52998224725");
    expect(semPontuacao.telefone).toBe(TELEFONE_VALIDO);
    expect(comPontuacao.documentoDigits).toBe("52998224725");
  });

  it("converte campos vazios em null", () => {
    const result = normalizeClientePayload({
      nome: "João",
      documento: "",
      telefone: "",
      email: "",
      endereco: "",
    });

    expect(result.documento).toBeNull();
    expect(result.documentoDigits).toBeNull();
    expect(result.telefone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.endereco).toBeNull();
  });
});

describe("documentoDigitsFrom", () => {
  it("extrai dígitos para comparação única", () => {
    expect(documentoDigitsFrom("529.982.247-25")).toBe("52998224725");
    expect(documentoDigitsFrom("52998224725")).toBe("52998224725");
    expect(documentoDigitsFrom(null)).toBeNull();
    expect(documentoDigitsFrom("")).toBeNull();
  });
});

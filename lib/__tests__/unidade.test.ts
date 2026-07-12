import { describe, expect, it } from "vitest";
import {
  clampQuantidade,
  formatPrecoUnitario,
  formatQuantidade,
  getQuantidadeInicial,
  getQuantidadeMin,
  getQuantidadeStep,
  normalizeUnidade,
  parseQuantidade,
  validateQuantidadeInput,
} from "../unidade";

describe("normalizeUnidade", () => {
  it("retorna METRO ou UNIDADE", () => {
    expect(normalizeUnidade("METRO")).toBe("METRO");
    expect(normalizeUnidade("UNIDADE")).toBe("UNIDADE");
    expect(normalizeUnidade(null)).toBe("UNIDADE");
    expect(normalizeUnidade("outro")).toBe("UNIDADE");
  });
});

describe("quantidade por unidade", () => {
  it("metro tem mínimo 0.1 e passo 0.1", () => {
    expect(getQuantidadeMin("METRO")).toBe(0.1);
    expect(getQuantidadeStep("METRO")).toBe(0.1);
    expect(getQuantidadeInicial("METRO")).toBe(1);
  });

  it("unidade tem mínimo 1 e passo 1", () => {
    expect(getQuantidadeMin("UNIDADE")).toBe(1);
    expect(getQuantidadeStep("UNIDADE")).toBe(1);
  });
});

describe("clampQuantidade", () => {
  it("limita ao mínimo", () => {
    expect(clampQuantidade(0, "UNIDADE")).toBe(1);
    expect(clampQuantidade(0, "METRO")).toBe(0.1);
  });

  it("arredonda ao passo", () => {
    expect(clampQuantidade(1.15, "METRO")).toBe(1.1);
    expect(clampQuantidade(2.4, "UNIDADE")).toBe(2);
  });
});

describe("parseQuantidade", () => {
  it("aceita número e string com vírgula", () => {
    expect(parseQuantidade("2,5", "METRO")).toBe(2.5);
    expect(parseQuantidade(3, "UNIDADE")).toBe(3);
  });

  it("usa mínimo para valor inválido", () => {
    expect(parseQuantidade("abc", "UNIDADE")).toBe(1);
    expect(parseQuantidade("", "METRO")).toBe(0.1);
  });
});

describe("validateQuantidadeInput", () => {
  it("rejeita vazio", () => {
    expect(validateQuantidadeInput("", "UNIDADE")).toEqual({
      valid: false,
      message: "Informe a quantidade",
    });
    expect(validateQuantidadeInput("", "METRO")).toEqual({
      valid: false,
      message: "Informe quantos metros serão cobrados",
    });
  });

  it("rejeita abaixo do mínimo", () => {
    const result = validateQuantidadeInput("0", "METRO");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.message).toContain("Mínimo");
    }
  });

  it("aceita valor válido", () => {
    const result = validateQuantidadeInput("2,5", "METRO");
    expect(result).toEqual({
      valid: true,
      quantidade: 2.5,
      display: "2,5",
    });
  });
});

describe("formatação de exibição", () => {
  it("formatQuantidade inclui m para metro", () => {
    expect(formatQuantidade(3, "METRO")).toBe("3 m");
    expect(formatQuantidade(2, "UNIDADE")).toBe("2");
  });

  it("formatPrecoUnitario inclui /m para metro", () => {
    expect(formatPrecoUnitario(10, "METRO")).toContain("/m");
    expect(formatPrecoUnitario(10, "UNIDADE")).not.toContain("/m");
  });
});

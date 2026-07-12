import { describe, expect, it } from "vitest";
import {
  isEmpresaConfigured,
  normalizeEmpresaPayload,
  validateEmpresa,
} from "../empresa";

const empresaValida = {
  razaoSocial: "GPM Desentupidora",
  cnpj: "11.444.777/0001-61",
  endereco: "Rua Exemplo, 100",
  telefone: "(11) 3333-4444",
  email: "contato@empresa.com",
};

describe("isEmpresaConfigured", () => {
  it("retorna false para null", () => {
    expect(isEmpresaConfigured(null)).toBe(false);
  });

  it("retorna true quando todos os campos obrigatórios estão preenchidos", () => {
    expect(isEmpresaConfigured(empresaValida)).toBe(true);
  });

  it("retorna false quando falta campo", () => {
    expect(isEmpresaConfigured({ ...empresaValida, cnpj: "" })).toBe(false);
  });
});

describe("validateEmpresa", () => {
  it("aceita empresa válida", () => {
    expect(validateEmpresa(empresaValida)).toBeNull();
  });

  it("exige razão social", () => {
    expect(validateEmpresa({ ...empresaValida, razaoSocial: "" })).toBe(
      "Razão social é obrigatória"
    );
  });

  it("valida CNPJ com dígitos verificadores", () => {
    expect(validateEmpresa({ ...empresaValida, cnpj: "11.111.111/1111-11" })).toBe(
      "CNPJ inválido"
    );
  });

  it("valida telefone", () => {
    expect(validateEmpresa({ ...empresaValida, telefone: "123" })).toContain(
      "Telefone inválido"
    );
  });

  it("valida e-mail", () => {
    expect(validateEmpresa({ ...empresaValida, email: "x" })).toBe(
      "E-mail inválido"
    );
  });
});

describe("normalizeEmpresaPayload", () => {
  it("formata CNPJ e telefone", () => {
    const result = normalizeEmpresaPayload({
      razaoSocial: "  Empresa  ",
      cnpj: "11444777000161",
      endereco: "Rua A",
      telefone: "11987654321",
      email: "  CONTATO@EMPRESA.COM  ",
      logoUrl: "",
    });

    expect(result.razaoSocial).toBe("Empresa");
    expect(result.cnpj).toBe("11.444.777/0001-61");
    expect(result.telefone).toBe("(11) 98765-4321");
    expect(result.email).toBe("contato@empresa.com");
    expect(result.logoUrl).toBeNull();
  });
});

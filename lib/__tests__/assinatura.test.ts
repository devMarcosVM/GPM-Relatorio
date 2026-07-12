import { describe, expect, it } from "vitest";
import { erroAssinatura, type DocumentoAssinaturaPublico } from "../assinatura";

function docBase(
  overrides: Partial<DocumentoAssinaturaPublico> = {}
): DocumentoAssinaturaPublico {
  return {
    tipo: "relatorio",
    id: "doc-1",
    numero: 1,
    jaAssinado: false,
    expirado: false,
    temAssinaturaTecnico: true,
    empresa: {
      razaoSocial: "Empresa",
      cnpj: "11.444.777/0001-61",
      endereco: "Rua A",
      telefone: "(11) 3333-4444",
      email: "a@b.com",
    },
    cliente: {
      nome: "Cliente",
      documento: null,
      telefone: null,
      endereco: null,
    },
    responsavelNome: "Técnico",
    ...overrides,
  };
}

describe("erroAssinatura", () => {
  it("retorna null quando pode assinar", () => {
    expect(erroAssinatura(docBase())).toBeNull();
  });

  it("retorna erro quando já assinado", () => {
    expect(erroAssinatura(docBase({ jaAssinado: true }))).toBe(
      "Este documento já foi assinado pelo cliente."
    );
  });

  it("retorna erro quando expirado", () => {
    expect(erroAssinatura(docBase({ expirado: true }))).toBe(
      "Este link expirou. Solicite um novo link ao prestador de serviço."
    );
  });

  it("prioriza mensagem de já assinado", () => {
    expect(
      erroAssinatura(docBase({ jaAssinado: true, expirado: true }))
    ).toContain("já foi assinado");
  });
});

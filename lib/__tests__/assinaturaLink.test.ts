import { describe, expect, it } from "vitest";
import {
  buildAssinaturaUrl,
  buildAssinaturaWhatsAppMessage,
  generateAssinaturaToken,
  getAssinaturaExpiry,
  isTokenExpirado,
} from "../assinaturaLink";

describe("generateAssinaturaToken", () => {
  it("gera token hexadecimal de 64 caracteres", () => {
    const token = generateAssinaturaToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(generateAssinaturaToken()).not.toBe(token);
  });
});

describe("getAssinaturaExpiry", () => {
  it("adiciona dias à data atual", () => {
    const now = new Date();
    const expiry = getAssinaturaExpiry(7);
    const diffDays = Math.round(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(7);
  });
});

describe("buildAssinaturaUrl", () => {
  it("monta URL sem barra dupla", () => {
    expect(buildAssinaturaUrl("abc123", "https://app.com/")).toBe(
      "https://app.com/assinar/abc123"
    );
  });

  it("usa NEXT_PUBLIC_APP_URL como fallback", () => {
    const original = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://producao.app";
    expect(buildAssinaturaUrl("token")).toBe("https://producao.app/assinar/token");
    process.env.NEXT_PUBLIC_APP_URL = original;
  });
});

describe("buildAssinaturaWhatsAppMessage", () => {
  it("monta mensagem de relatório", () => {
    const msg = buildAssinaturaWhatsAppMessage({
      tipo: "relatorio",
      numero: 5,
      nomeCliente: "Maria",
      token: "abc",
      origin: "https://app.com",
    });

    expect(msg).toContain("Olá, Maria!");
    expect(msg).toContain("Relatorio de Servico #0005");
    expect(msg).toContain("https://app.com/assinar/abc");
    expect(msg).toContain("Válido por 7 dias");
  });

  it("monta mensagem de orçamento com total", () => {
    const msg = buildAssinaturaWhatsAppMessage({
      tipo: "orcamento",
      numero: 12,
      nomeCliente: "João",
      token: "xyz",
      origin: "https://app.com",
      total: "R$ 500,00",
    });

    expect(msg).toContain("Orcamento #0012");
    expect(msg).toContain("R$ 500,00");
  });
});

describe("isTokenExpirado", () => {
  it("retorna true para null", () => {
    expect(isTokenExpirado(null)).toBe(true);
  });

  it("retorna true para data passada", () => {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    expect(isTokenExpirado(ontem)).toBe(true);
  });

  it("retorna false para data futura", () => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    expect(isTokenExpirado(amanha)).toBe(false);
  });
});

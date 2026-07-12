import { describe, expect, it } from "vitest";
import { telefoneParaWhatsApp } from "../documentosBr";

describe("integração WhatsApp", () => {
  it("prepara telefone com DDI para wa.me", () => {
    expect(telefoneParaWhatsApp("(21) 98888-7777")).toBe("5521988887777");
  });

  it("não duplica DDI 55", () => {
    expect(telefoneParaWhatsApp("5521988887777")).toBe("5521988887777");
  });
});

describe("cenários de cadastro de cliente", () => {
  const casos = [
    { entrada: "52998224725", esperado: "529.982.247-25", tipo: "CPF" },
    { entrada: "11444777000161", esperado: "11.444.777/0001-61", tipo: "CNPJ" },
    { entrada: "1133334444", esperado: "(11) 3333-4444", tipo: "fixo" },
    { entrada: "11987654321", esperado: "(11) 98765-4321", tipo: "celular" },
  ];

  casos.forEach(({ entrada, esperado, tipo }) => {
    it(`normaliza ${tipo} corretamente`, async () => {
      const { normalizeClientePayload } = await import("../cliente");
      const { formatDocumento, formatTelefone } = await import("../documentosBr");

      if (tipo === "CPF" || tipo === "CNPJ") {
        expect(formatDocumento(entrada)).toBe(esperado);
      } else {
        expect(formatTelefone(entrada)).toBe(esperado);
      }

      const payload = normalizeClientePayload({
        nome: "Teste",
        documento: tipo === "CPF" || tipo === "CNPJ" ? entrada : null,
        telefone: tipo === "fixo" || tipo === "celular" ? entrada : null,
      });

      if (tipo === "CPF" || tipo === "CNPJ") {
        expect(payload.documento).toBe(esperado);
      }
      if (tipo === "fixo" || tipo === "celular") {
        expect(payload.telefone).toBe(esperado);
      }
    });
  });
});

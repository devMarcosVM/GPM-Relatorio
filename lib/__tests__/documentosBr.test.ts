import { describe, expect, it } from "vitest";
import {
  apenasDigitos,
  detectarTipoDocumento,
  formatCnpj,
  formatCpf,
  formatDocumento,
  formatTelefone,
  mensagemErroDocumento,
  mensagemErroTelefone,
  normalizarDocumento,
  normalizarTelefone,
  padronizarDocumento,
  padronizarTelefone,
  telefoneParaWhatsApp,
  validarCnpj,
  validarCpf,
  validarDocumento,
  validarTelefone,
} from "../documentosBr";

const CPF_VALIDO = "529.982.247-25";
const CPF_VALIDO_DIGITOS = "52998224725";
const CNPJ_VALIDO = "11.444.777/0001-61";
const CNPJ_VALIDO_DIGITOS = "11444777000161";

describe("apenasDigitos", () => {
  it("remove pontuação", () => {
    expect(apenasDigitos("529.982.247-25")).toBe(CPF_VALIDO_DIGITOS);
    expect(apenasDigitos("(11) 98765-4321")).toBe("11987654321");
  });

  it("retorna vazio para string vazia", () => {
    expect(apenasDigitos("")).toBe("");
  });
});

describe("detectarTipoDocumento", () => {
  it("detecta CPF até 11 dígitos", () => {
    expect(detectarTipoDocumento("529")).toBe("CPF");
    expect(detectarTipoDocumento(CPF_VALIDO)).toBe("CPF");
  });

  it("detecta CNPJ com mais de 11 dígitos", () => {
    expect(detectarTipoDocumento("114447770001")).toBe("CNPJ");
    expect(detectarTipoDocumento(CNPJ_VALIDO)).toBe("CNPJ");
  });

  it("retorna null para vazio", () => {
    expect(detectarTipoDocumento("")).toBeNull();
  });
});

describe("formatCpf", () => {
  it("formata progressivamente", () => {
    expect(formatCpf("529")).toBe("529");
    expect(formatCpf("529982")).toBe("529.982");
    expect(formatCpf("529982247")).toBe("529.982.247");
    expect(formatCpf(CPF_VALIDO_DIGITOS)).toBe(CPF_VALIDO);
  });

  it("limita a 11 dígitos", () => {
    expect(formatCpf("52998224725123")).toBe(CPF_VALIDO);
  });
});

describe("formatCnpj", () => {
  it("formata progressivamente", () => {
    expect(formatCnpj("11")).toBe("11");
    expect(formatCnpj("11444")).toBe("11.444");
    expect(formatCnpj("11444777")).toBe("11.444.777");
    expect(formatCnpj("114447770001")).toBe("11.444.777/0001");
    expect(formatCnpj(CNPJ_VALIDO_DIGITOS)).toBe(CNPJ_VALIDO);
  });

  it("limita a 14 dígitos", () => {
    expect(formatCnpj("11444777000161111")).toBe(CNPJ_VALIDO);
  });
});

describe("formatDocumento", () => {
  it("usa máscara de CPF para até 11 dígitos", () => {
    expect(formatDocumento(CPF_VALIDO_DIGITOS)).toBe(CPF_VALIDO);
  });

  it("usa máscara de CNPJ para 12+ dígitos", () => {
    expect(formatDocumento(CNPJ_VALIDO_DIGITOS)).toBe(CNPJ_VALIDO);
  });
});

describe("formatTelefone", () => {
  it("formata fixo com 10 dígitos", () => {
    expect(formatTelefone("1133334444")).toBe("(11) 3333-4444");
  });

  it("formata celular com 11 dígitos", () => {
    expect(formatTelefone("11987654321")).toBe("(11) 98765-4321");
  });

  it("remove DDI 55 ao formatar", () => {
    expect(formatTelefone("5511987654321")).toBe("(11) 98765-4321");
  });

  it("limita a 11 dígitos locais", () => {
    expect(formatTelefone("11987654321999")).toBe("(11) 98765-4321");
  });
});

describe("validarCpf", () => {
  it("aceita CPF válido", () => {
    expect(validarCpf(CPF_VALIDO)).toBe(true);
    expect(validarCpf(CPF_VALIDO_DIGITOS)).toBe(true);
  });

  it("rejeita CPF com dígitos repetidos", () => {
    expect(validarCpf("111.111.111-11")).toBe(false);
    expect(validarCpf("00000000000")).toBe(false);
  });

  it("rejeita CPF com tamanho incorreto", () => {
    expect(validarCpf("5299822472")).toBe(false);
    expect(validarCpf("529982247255")).toBe(false);
  });

  it("rejeita CPF com dígito verificador errado", () => {
    expect(validarCpf("529.982.247-24")).toBe(false);
  });
});

describe("validarCnpj", () => {
  it("aceita CNPJ válido", () => {
    expect(validarCnpj(CNPJ_VALIDO)).toBe(true);
    expect(validarCnpj(CNPJ_VALIDO_DIGITOS)).toBe(true);
  });

  it("rejeita CNPJ com dígitos repetidos", () => {
    expect(validarCnpj("11.111.111/1111-11")).toBe(false);
  });

  it("rejeita CNPJ com tamanho incorreto", () => {
    expect(validarCnpj("114447770001")).toBe(false);
  });

  it("rejeita CNPJ com dígito verificador errado", () => {
    expect(validarCnpj("11.444.777/0001-60")).toBe(false);
  });
});

describe("validarDocumento", () => {
  it("valida CPF e CNPJ automaticamente", () => {
    expect(validarDocumento(CPF_VALIDO)).toBe(true);
    expect(validarDocumento(CNPJ_VALIDO)).toBe(true);
    expect(validarDocumento("111.111.111-11")).toBe(false);
  });
});

describe("validarTelefone", () => {
  it("aceita fixo e celular válidos", () => {
    expect(validarTelefone("(11) 3333-4444")).toBe(true);
    expect(validarTelefone("(11) 98765-4321")).toBe(true);
    expect(validarTelefone("5511987654321")).toBe(true);
  });

  it("rejeita DDD inválido", () => {
    expect(validarTelefone("(10) 98765-4321")).toBe(false);
    expect(validarTelefone("(00) 3333-4444")).toBe(false);
  });

  it("rejeita celular sem 9 na terceira posição", () => {
    expect(validarTelefone("(11) 88765-4321")).toBe(false);
  });

  it("rejeita tamanhos incorretos", () => {
    expect(validarTelefone("(11) 3333-444")).toBe(false);
    expect(validarTelefone("")).toBe(false);
  });
});

describe("mensagemErroDocumento", () => {
  it("retorna null para vazio", () => {
    expect(mensagemErroDocumento("")).toBeNull();
    expect(mensagemErroDocumento("   ")).toBeNull();
  });

  it("retorna erro para CPF incompleto", () => {
    expect(mensagemErroDocumento("529.982.247")).toBe("CPF deve ter 11 dígitos");
  });

  it("retorna erro para CPF inválido", () => {
    expect(mensagemErroDocumento("111.111.111-11")).toBe("CPF inválido");
  });

  it("retorna erro para CNPJ incompleto", () => {
    expect(mensagemErroDocumento("11.444.777/0001")).toBe(
      "CNPJ deve ter 14 dígitos"
    );
  });

  it("retorna erro para CNPJ inválido", () => {
    expect(mensagemErroDocumento("11.444.777/0001-60")).toBe("CNPJ inválido");
  });

  it("aceita documentos válidos", () => {
    expect(mensagemErroDocumento(CPF_VALIDO)).toBeNull();
    expect(mensagemErroDocumento(CNPJ_VALIDO)).toBeNull();
  });
});

describe("mensagemErroTelefone", () => {
  it("retorna null para vazio", () => {
    expect(mensagemErroTelefone("")).toBeNull();
  });

  it("retorna erro para telefone inválido", () => {
    expect(mensagemErroTelefone("123")).toContain("Telefone inválido");
  });

  it("aceita telefone válido", () => {
    expect(mensagemErroTelefone("(11) 98765-4321")).toBeNull();
  });
});

describe("normalizarDocumento e normalizarTelefone", () => {
  it("normaliza para formato padrão", () => {
    expect(normalizarDocumento(CPF_VALIDO_DIGITOS)).toBe(CPF_VALIDO);
    expect(normalizarDocumento(CNPJ_VALIDO_DIGITOS)).toBe(CNPJ_VALIDO);
    expect(normalizarTelefone("11987654321")).toBe("(11) 98765-4321");
  });

  it("retorna null para vazio", () => {
    expect(normalizarDocumento(null)).toBeNull();
    expect(normalizarTelefone("  ")).toBeNull();
  });
});

describe("padronização independente da pontuação", () => {
  const cpfVariantes = [
    "52998224725",
    "529.982.247-25",
    "529982247-25",
    "529.98224725",
    "529 982 247 25",
  ];

  cpfVariantes.forEach((entrada) => {
    it(`CPF "${entrada}" → ${CPF_VALIDO}`, () => {
      expect(padronizarDocumento(entrada)).toBe(CPF_VALIDO);
      expect(formatDocumento(entrada)).toBe(CPF_VALIDO);
      expect(padronizarDocumento(CPF_VALIDO)).toBe(CPF_VALIDO);
    });
  });

  const cnpjVariantes = [
    "11444777000161",
    "11.444.777/0001-61",
    "11.444.777.0001-61",
    "11 444 777 0001 61",
    "114447770001-61",
  ];

  cnpjVariantes.forEach((entrada) => {
    it(`CNPJ "${entrada}" → ${CNPJ_VALIDO}`, () => {
      expect(padronizarDocumento(entrada)).toBe(CNPJ_VALIDO);
      expect(padronizarDocumento(CNPJ_VALIDO)).toBe(CNPJ_VALIDO);
    });
  });

  const telVariantes = [
    ["11987654321", "(11) 98765-4321"],
    ["(11) 98765-4321", "(11) 98765-4321"],
    ["11 98765 4321", "(11) 98765-4321"],
    ["11-98765-4321", "(11) 98765-4321"],
    ["5511987654321", "(11) 98765-4321"],
    ["1133334444", "(11) 3333-4444"],
    ["(11) 3333-4444", "(11) 3333-4444"],
    ["11 3333 4444", "(11) 3333-4444"],
  ] as const;

  telVariantes.forEach(([entrada, esperado]) => {
    it(`telefone "${entrada}" → ${esperado}`, () => {
      expect(padronizarTelefone(entrada)).toBe(esperado);
      expect(padronizarTelefone(esperado)).toBe(esperado);
    });
  });
});

describe("telefoneParaWhatsApp", () => {
  it("adiciona DDI 55 quando ausente", () => {
    expect(telefoneParaWhatsApp("(11) 98765-4321")).toBe("5511987654321");
    expect(telefoneParaWhatsApp("(11) 3333-4444")).toBe("551133334444");
  });

  it("mantém DDI quando já presente", () => {
    expect(telefoneParaWhatsApp("5511987654321")).toBe("5511987654321");
  });
});

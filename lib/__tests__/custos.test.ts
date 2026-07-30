import { describe, expect, it } from "vitest";
import { calcularLucro, somaCustos } from "@/lib/custos";

describe("custos", () => {
  it("soma custos independentes", () => {
    expect(somaCustos([{ valor: 50 }, { valor: 75.5 }])).toBe(125.5);
    expect(somaCustos([])).toBe(0);
  });

  it("calcula lucro com orçamentos aprovados e gastos do período", () => {
    expect(calcularLucro(1000, 250)).toBe(750);
    expect(calcularLucro(100, 150)).toBe(-50);
  });
});

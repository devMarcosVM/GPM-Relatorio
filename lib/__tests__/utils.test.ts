import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate, formatDateTime } from "../utils";

describe("formatCurrency", () => {
  it("formata em reais brasileiros", () => {
    expect(formatCurrency(1234.5)).toContain("1.234,50");
    expect(formatCurrency(0)).toContain("0,00");
  });
});

describe("formatDate", () => {
  it("formata data no padrão brasileiro", () => {
    const formatted = formatDate(new Date(2026, 6, 12));
    expect(formatted).toMatch(/12\/07\/2026/);
  });

  it("aceita string ISO", () => {
    const formatted = formatDate("2026-01-05T10:00:00.000Z");
    expect(formatted).toMatch(/\d{2}\/\d{2}\/2026/);
  });
});

describe("formatDateTime", () => {
  it("inclui hora e minuto", () => {
    const formatted = formatDateTime(new Date(2026, 6, 12, 14, 30));
    expect(formatted).toContain("12/07/2026");
    expect(formatted).toMatch(/14:30|14:30:00/);
  });
});

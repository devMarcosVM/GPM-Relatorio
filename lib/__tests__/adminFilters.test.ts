import { describe, expect, it } from "vitest";
import {
  isInDateRange,
  matchesSearch,
  parseDateEnd,
  parseDateStart,
  toDateInputValue,
} from "../adminFilters";

describe("toDateInputValue", () => {
  it("formata data para input HTML", () => {
    expect(toDateInputValue(new Date(2026, 6, 12))).toBe("2026-07-12");
  });
});

describe("isInDateRange", () => {
  const value = "2026-07-10T12:00:00.000Z";

  it("retorna true sem filtros", () => {
    expect(isInDateRange(value, "", "")).toBe(true);
  });

  it("filtra por data inicial", () => {
    expect(isInDateRange(value, "2026-07-11", "")).toBe(false);
    expect(isInDateRange(value, "2026-07-10", "")).toBe(true);
  });

  it("filtra por data final", () => {
    expect(isInDateRange(value, "", "2026-07-09")).toBe(false);
    expect(isInDateRange(value, "", "2026-07-10")).toBe(true);
  });

  it("aceita objeto Date", () => {
    expect(isInDateRange(new Date(2026, 6, 10), "2026-07-10", "2026-07-10")).toBe(
      true
    );
  });
});

describe("matchesSearch", () => {
  it("retorna true para busca vazia", () => {
    expect(matchesSearch(["João", "11999"], "")).toBe(true);
  });

  it("busca case insensitive em qualquer campo", () => {
    expect(matchesSearch(["João Silva", null, "(11) 98765-4321"], "joão")).toBe(
      true
    );
    expect(matchesSearch(["João Silva", null, "(11) 98765-4321"], "98765")).toBe(
      true
    );
    expect(matchesSearch(["João Silva"], "maria")).toBe(false);
  });
});

describe("parseDateStart e parseDateEnd", () => {
  it("define início e fim do dia", () => {
    const start = parseDateStart("2026-07-10");
    const end = parseDateEnd("2026-07-10");
    expect(start.getHours()).toBe(0);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
  });
});

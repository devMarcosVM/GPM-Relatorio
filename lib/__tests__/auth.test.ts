import { describe, expect, it } from "vitest";
import { getSessionExpiration, getSessionMaxAgeSeconds } from "../auth";

describe("duração da sessão por papel", () => {
  it("técnico permanece logado por 8 horas", () => {
    expect(getSessionMaxAgeSeconds("TECNICO")).toBe(60 * 60 * 8);
    expect(getSessionExpiration("TECNICO")).toBe("8h");
  });

  it("admin permanece logado por 7 dias", () => {
    expect(getSessionMaxAgeSeconds("ADMIN")).toBe(60 * 60 * 24 * 7);
    expect(getSessionExpiration("ADMIN")).toBe("7d");
  });
});

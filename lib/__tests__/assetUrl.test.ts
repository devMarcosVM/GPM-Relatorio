import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getAbsoluteUrl, toAssetPath, toStoredAssetPath } from "../assetUrl";

const SUPABASE_URL =
  "https://pvxmcaasiijltwcbquyp.supabase.co/storage/v1/object/public/relatorio-fotos/fotos/logo.png";

describe("toAssetPath", () => {
  it("mantém URL completa do Supabase", () => {
    expect(toAssetPath(SUPABASE_URL)).toBe(SUPABASE_URL);
  });

  it("converte /uploads para /api/media", () => {
    expect(toAssetPath("/uploads/foto.jpg")).toBe("/api/media/foto.jpg");
    expect(toAssetPath("https://app.com/uploads/foto.jpg")).toBe(
      "/api/media/foto.jpg"
    );
  });

  it("mantém /api/media", () => {
    expect(toAssetPath("/api/media/foto.jpg")).toBe("/api/media/foto.jpg");
  });

  it("mantém data URL", () => {
    const data = "data:image/png;base64,abc";
    expect(toAssetPath(data)).toBe(data);
  });

  it("retorna vazio para string vazia", () => {
    expect(toAssetPath("")).toBe("");
  });
});

describe("toStoredAssetPath", () => {
  it("converte /api/media para /uploads", () => {
    expect(toStoredAssetPath("/api/media/foto.jpg")).toBe("/uploads/foto.jpg");
  });

  it("mantém URL externa do Supabase", () => {
    expect(toStoredAssetPath(SUPABASE_URL)).toBe(SUPABASE_URL);
  });
});

describe("getAbsoluteUrl", () => {
  const original = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.exemplo.com";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it("retorna URL http sem alteração", () => {
    expect(getAbsoluteUrl(SUPABASE_URL)).toBe(SUPABASE_URL);
  });

  it("monta URL absoluta para upload local", () => {
    expect(getAbsoluteUrl("/uploads/foto.jpg")).toBe(
      "https://app.exemplo.com/api/media/foto.jpg"
    );
  });

  it("monta URL absoluta para caminho relativo", () => {
    expect(getAbsoluteUrl("/assinar/token")).toBe(
      "https://app.exemplo.com/assinar/token"
    );
  });
});

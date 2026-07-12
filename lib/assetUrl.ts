/** Caminho relativo salvo no banco: /uploads/arquivo.jpg */
export function toStoredAssetPath(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const pathname = new URL(url).pathname;
      if (pathname.startsWith("/api/media/")) {
        return `/uploads/${pathname.slice("/api/media/".length)}`;
      }
      return pathname.startsWith("/uploads/") ? pathname : url;
    } catch {
      return url;
    }
  }
  if (url.startsWith("/api/media/")) {
    return `/uploads/${url.slice("/api/media/".length)}`;
  }
  return url.startsWith("/") ? url : `/${url}`;
}

/** URL para exibir no navegador (funciona em qualquer host/IP) */
export function toAssetPath(url: string): string {
  if (!url) return url;
  if (url.startsWith("data:")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const pathname = new URL(url).pathname;
      if (pathname.startsWith("/uploads/")) {
        return `/api/media/${pathname.slice("/uploads/".length)}`;
      }
      if (pathname.startsWith("/api/media/")) return pathname;
      // Supabase / CDN — manter URL completa
      return url;
    } catch {
      return url;
    }
  }
  if (url.startsWith("/uploads/")) {
    return `/api/media/${url.slice("/uploads/".length)}`;
  }
  return url.startsWith("/") ? url : `/${url}`;
}

export function getAbsoluteUrl(relativePath: string): string {
  if (relativePath.startsWith("http")) return relativePath;
  const path = toStoredAssetPath(relativePath);
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (path.startsWith("/uploads/")) {
    return `${base}/api/media/${path.slice("/uploads/".length)}`;
  }
  return `${base}${path}`;
}

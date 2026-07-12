"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NovoRelatorioPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/relatorios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((r) => r.json())
      .then((relatorio) => {
        if (relatorio.id) {
          router.replace(`/campo/relatorio/${relatorio.id}`);
        }
      });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-muted">Iniciando relatório...</p>
    </div>
  );
}

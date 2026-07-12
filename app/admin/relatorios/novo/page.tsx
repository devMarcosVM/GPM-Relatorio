"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminNovoRelatorioPage() {
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
          router.replace(`/admin/relatorios/${relatorio.id}`);
        } else {
          router.replace("/admin/relatorios");
        }
      });
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20 text-muted">
      Criando relatório...
    </div>
  );
}

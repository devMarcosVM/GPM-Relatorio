"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrcamentoForm } from "@/components/orcamento/OrcamentoForm";

export default function EditarOrcamentoCampoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const excluir = async () => {
    if (!confirm("Excluir este orçamento? Esta ação não pode ser desfeita.")) return;
    const res = await fetch(`/api/orcamentos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Erro ao excluir");
      return;
    }
    router.push("/campo/orcamentos");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/campo/orcamentos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-semibold">Continuar orçamento</h1>
        </div>
        <Button variant="danger" size="sm" onClick={excluir}>
          <Trash2 className="h-4 w-4" />
          Excluir
        </Button>
      </header>

      <main className="p-4">
        <OrcamentoForm
          orcamentoId={id}
          backHref="/campo/orcamentos"
          backLabel="Voltar aos Orçamentos"
        />
      </main>
    </div>
  );
}

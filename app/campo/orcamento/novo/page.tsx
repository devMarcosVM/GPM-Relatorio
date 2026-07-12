"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  OrcamentoForm,
} from "@/components/orcamento/OrcamentoForm";

export default function NovoOrcamentoPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center gap-3 bg-white border-b px-4 py-3">
        <Link href="/campo">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold">Novo Orçamento</h1>
      </header>

      <main className="p-4">
        <OrcamentoForm backHref="/campo" backLabel="Voltar ao Início" />
      </main>
    </div>
  );
}

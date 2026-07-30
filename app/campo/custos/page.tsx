"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CustosManager } from "@/components/custos/CustosManager";

export default function CampoCustosPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center gap-3 border-b bg-white px-4 py-3">
        <Link href="/campo" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold">Custos</h1>
      </header>
      <main className="mx-auto max-w-lg p-4">
        <CustosManager />
      </main>
    </div>
  );
}

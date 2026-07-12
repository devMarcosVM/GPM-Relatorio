"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Relatorio {
  id: string;
  numero: number;
  status: string;
  createdAt: string;
  cliente: { nome: string } | null;
}

export default function CampoRelatoriosPage() {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/relatorios?mine=true")
      .then((r) => r.json())
      .then(setRelatorios)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-primary px-4 py-4 text-white">
        <div className="flex items-center gap-3">
          <Link href="/campo">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <p className="text-sm opacity-80">Campo</p>
            <p className="font-semibold">Meus Relatórios</p>
          </div>
          <Link href="/campo/relatorio/novo">
            <Button size="sm" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
              <Plus className="h-4 w-4" />
              Novo
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-3 p-4">
        {loading ? (
          <Card className="py-8 text-center text-sm text-muted">Carregando...</Card>
        ) : relatorios.length === 0 ? (
          <Card className="space-y-4 py-8 text-center">
            <p className="text-sm text-muted">Nenhum relatório ainda</p>
            <Link href="/campo/relatorio/novo">
              <Button>
                <Plus className="h-4 w-4" />
                Criar relatório
              </Button>
            </Link>
          </Card>
        ) : (
          relatorios.map((r) => (
            <Link key={r.id} href={`/campo/relatorio/${r.id}`}>
              <Card className="flex items-center justify-between hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      #{String(r.numero).padStart(4, "0")} —{" "}
                      {r.cliente?.nome || "Cliente pendente"}
                    </p>
                    <p className="text-xs text-muted">{formatDate(r.createdAt)}</p>
                  </div>
                </div>
                <Badge variant={r.status === "FINALIZADO" ? "success" : "warning"}>
                  {r.status === "FINALIZADO" ? "Finalizado" : "Rascunho"}
                </Badge>
              </Card>
            </Link>
          ))
        )}
      </main>
    </div>
  );
}

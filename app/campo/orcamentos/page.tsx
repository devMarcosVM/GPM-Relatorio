"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Receipt, Plus } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { calcOrcamentoTotal } from "@/lib/orcamento";

interface Orcamento {
  id: string;
  numero: number;
  status: string;
  desconto: number;
  valorFinal?: number | null;
  assinaturaCliente?: string | null;
  createdAt: string;
  cliente: { nome: string };
  itens: Array<{ quantidade: number; precoUnitario: number }>;
}

export default function CampoOrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orcamentos?mine=true")
      .then((r) => r.json())
      .then(setOrcamentos)
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
            <p className="font-semibold">Meus Orçamentos</p>
          </div>
          <Link href="/campo/orcamento/novo">
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
        ) : orcamentos.length === 0 ? (
          <Card className="space-y-4 py-8 text-center">
            <p className="text-sm text-muted">Nenhum orçamento ainda</p>
            <Link href="/campo/orcamento/novo">
              <Button>
                <Plus className="h-4 w-4" />
                Criar orçamento
              </Button>
            </Link>
          </Card>
        ) : (
          orcamentos.map((o) => (
            <Link key={o.id} href={`/campo/orcamento/${o.id}`}>
              <Card className="flex items-center justify-between hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-green-700" />
                  <div>
                    <p className="font-medium">
                      #{String(o.numero).padStart(4, "0")} — {o.cliente.nome}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDate(o.createdAt)} —{" "}
                      {formatCurrency(
                        calcOrcamentoTotal(o.itens, o.desconto, o.valorFinal)
                      )}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    o.assinaturaCliente || o.status === "APROVADO"
                      ? "success"
                      : "warning"
                  }
                >
                  {o.assinaturaCliente ? "Assinado" : o.status}
                </Badge>
              </Card>
            </Link>
          ))
        )}
      </main>
    </div>
  );
}

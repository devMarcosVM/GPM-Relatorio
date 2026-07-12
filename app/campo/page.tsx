"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, ClipboardList, LogOut, Receipt } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Relatorio {
  id: string;
  numero: number;
  status: string;
  createdAt: string;
  cliente: { nome: string } | null;
}

export default function CampoHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ nome: string } | null>(null);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user));
    fetch("/api/relatorios?mine=true")
      .then((r) => r.json())
      .then(setRelatorios);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-primary px-4 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Olá,</p>
            <p className="font-semibold">{user?.nome || "..."}</p>
          </div>
          <button onClick={logout} className="rounded-lg p-2 hover:bg-white/10">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/campo/relatorio/novo">
            <Card className="flex flex-col items-center gap-2 py-6 hover:border-primary transition-colors cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-primary">
                <Plus className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">Novo Relatório</span>
            </Card>
          </Link>
          <Link href="/campo/orcamento/novo">
            <Card className="flex flex-col items-center gap-2 py-6 hover:border-primary transition-colors cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                <Receipt className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">Novo Orçamento</span>
            </Card>
          </Link>
        </div>

        <section>
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <ClipboardList className="h-5 w-5" />
            Meus Relatórios
          </h2>

          {relatorios.length === 0 ? (
            <Card className="text-center py-8 text-muted text-sm">
              Nenhum relatório ainda
            </Card>
          ) : (
            <div className="space-y-2">
              {relatorios.map((r) => (
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
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Receipt,
  LogOut,
  ChevronRight,
  Calculator,
  UserPlus,
  WalletCards,
} from "lucide-react";

export default function CampoHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ nome: string } | null>(null);
  const [counts, setCounts] = useState({ relatorios: 0, orcamentos: 0 });

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user));
    Promise.all([
      fetch("/api/relatorios?mine=true").then((r) => r.json()),
      fetch("/api/orcamentos?mine=true").then((r) => r.json()),
    ]).then(([relatorios, orcamentos]) => {
      setCounts({
        relatorios: Array.isArray(relatorios) ? relatorios.length : 0,
        orcamentos: Array.isArray(orcamentos) ? orcamentos.length : 0,
      });
    });
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
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted">Ações rápidas</h2>
          <div className="space-y-3">
            <Link href="/campo/calculadora">
              <Card className="flex items-center gap-4 p-5 hover:border-primary transition-colors cursor-pointer">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Calculator className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold">Calculadora</p>
                  <p className="text-sm text-muted">
                    Estimar valor na hora — sem cadastro
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted" />
              </Card>
            </Link>

            <Link href="/campo/cliente/novo">
              <Card className="flex items-center gap-4 p-5 hover:border-primary transition-colors cursor-pointer">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <UserPlus className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold">Novo cliente</p>
                  <p className="text-sm text-muted">
                    Cadastrar para usar em relatório ou orçamento
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted" />
              </Card>
            </Link>

            <Link href="/campo/custos">
              <Card className="flex items-center gap-4 p-5 hover:border-primary transition-colors cursor-pointer">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                  <WalletCards className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold">Custos</p>
                  <p className="text-sm text-muted">
                    Registrar gasolina, ajudante e outros gastos
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted" />
              </Card>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium text-muted">Meus registros</h2>
          <div className="space-y-3">
            <Link href="/campo/relatorios">
              <Card className="flex items-center gap-4 p-5 hover:border-primary transition-colors cursor-pointer">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-primary">
                  <FileText className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold">Relatórios</p>
                  <p className="text-sm text-muted">
                    {counts.relatorios} relatório(s) — ver e editar
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted" />
              </Card>
            </Link>

            <Link href="/campo/orcamentos">
              <Card className="flex items-center gap-4 p-5 hover:border-primary transition-colors cursor-pointer">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                  <Receipt className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold">Orçamentos</p>
                  <p className="text-sm text-muted">
                    {counts.orcamentos} orçamento(s) — ver e enviar link
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted" />
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

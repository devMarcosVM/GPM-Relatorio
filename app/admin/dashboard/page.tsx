"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Receipt,
  Users,
  Wrench,
  Plus,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { defaultMonthRange } from "@/lib/adminFilters";
import Link from "next/link";

interface DashboardStats {
  relatoriosFinalizados: number;
  servicosRealizados: number;
  orcamentosTotal: number;
  orcamentosAprovados: number;
  orcamentosPendentes: number;
  receitaAprovada: number;
  receitaPotencial: number;
  novosClientes: number;
  recentRelatorios: Array<{
    id: string;
    numero: number;
    status: string;
    dataInicio: string;
    cliente: { nome: string } | null;
  }>;
  recentOrcamentos: Array<{
    id: string;
    numero: number;
    status: string;
    createdAt: string;
    cliente: { nome: string };
    total: number;
  }>;
}

export default function DashboardPage() {
  const defaults = defaultMonthRange();
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);

    const res = await fetch(`/api/admin/stats?${params}`);
    const data = await res.json();
    setStats(data);
    setLoading(false);
  }, [dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const cards = stats
    ? [
        {
          label: "Serviços realizados",
          value: String(stats.servicosRealizados),
          hint: `${stats.relatoriosFinalizados} relatório(s) finalizado(s)`,
          icon: CheckCircle2,
          color: "text-sky-600 bg-sky-100",
        },
        {
          label: "Receita aprovada",
          value: formatCurrency(stats.receitaAprovada),
          hint: `${stats.orcamentosAprovados} orçamento(s) aprovado(s)`,
          icon: DollarSign,
          color: "text-green-600 bg-green-100",
        },
        {
          label: "Novos clientes",
          value: String(stats.novosClientes),
          hint: "Cadastrados no período",
          icon: Users,
          color: "text-purple-600 bg-purple-100",
        },
        {
          label: "Orçamentos pendentes",
          value: formatCurrency(stats.receitaPotencial),
          hint: `${stats.orcamentosPendentes} aguardando resposta`,
          icon: Receipt,
          color: "text-amber-600 bg-amber-100",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">De</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Até</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const d = defaultMonthRange();
              setDateFrom(d.from);
              setDateTo(d.to);
            }}
          >
            Este mês
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="py-10 text-center text-muted">Carregando...</Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label}>
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl font-bold truncate">{card.value}</p>
                      <p className="text-sm font-medium">{card.label}</p>
                      <p className="text-xs text-muted mt-0.5">{card.hint}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <div className="flex items-center gap-2 text-sm text-muted mb-1">
                <FileText className="h-4 w-4" />
                Relatórios no período
              </div>
              <p className="text-2xl font-bold">{stats?.relatoriosFinalizados ?? 0}</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-sm text-muted mb-1">
                <Receipt className="h-4 w-4" />
                Orçamentos no período
              </div>
              <p className="text-2xl font-bold">{stats?.orcamentosTotal ?? 0}</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-sm text-muted mb-1">
                <Wrench className="h-4 w-4" />
                Média serviços / relatório
              </div>
              <p className="text-2xl font-bold">
                {stats && stats.relatoriosFinalizados > 0
                  ? (stats.servicosRealizados / stats.relatoriosFinalizados).toFixed(1)
                  : "0"}
              </p>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardTitle className="mb-4">Relatórios Recentes</CardTitle>
              {!stats?.recentRelatorios.length ? (
                <p className="text-sm text-muted">Nenhum relatório no período</p>
              ) : (
                <div className="space-y-2">
                  {stats.recentRelatorios.map((r) => (
                    <Link
                      key={r.id}
                      href={`/admin/relatorios/${r.id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          #{String(r.numero).padStart(4, "0")} —{" "}
                          {r.cliente?.nome || "Cliente pendente"}
                        </p>
                        <p className="text-xs text-muted">
                          {formatDate(r.dataInicio)}
                        </p>
                      </div>
                      <Badge
                        variant={r.status === "FINALIZADO" ? "success" : "warning"}
                      >
                        {r.status === "FINALIZADO" ? "Finalizado" : "Rascunho"}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <CardTitle className="mb-4">Orçamentos Recentes</CardTitle>
              {!stats?.recentOrcamentos.length ? (
                <p className="text-sm text-muted">Nenhum orçamento no período</p>
              ) : (
                <div className="space-y-2">
                  {stats.recentOrcamentos.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          #{String(o.numero).padStart(4, "0")} — {o.cliente.nome}
                        </p>
                        <p className="text-xs text-muted">
                          {formatDate(o.createdAt)} • {formatCurrency(o.total)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          o.status === "APROVADO"
                            ? "success"
                            : o.status === "RECUSADO"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {o.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

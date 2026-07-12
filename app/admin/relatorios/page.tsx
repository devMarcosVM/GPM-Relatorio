"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListFilters } from "@/components/admin/ListFilters";
import { Download, Trash2, Eye, Plus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { isInDateRange, matchesSearch } from "@/lib/adminFilters";

interface Relatorio {
  id: string;
  numero: number;
  status: string;
  createdAt: string;
  dataInicio: string;
  enderecoServico?: string | null;
  cliente: { nome: string } | null;
  tecnico: { nome: string };
  itens: Array<{ servico: { nome: string }; fotos: unknown[] }>;
}

export default function RelatoriosAdminPage() {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = () => {
    fetch("/api/relatorios")
      .then((r) => r.json())
      .then(setRelatorios);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return relatorios.filter((r) => {
      const dateOk = isInDateRange(r.dataInicio, dateFrom, dateTo);
      const searchOk = matchesSearch(
        [
          r.cliente?.nome,
          r.tecnico.nome,
          String(r.numero),
          r.enderecoServico,
          ...r.itens.map((i) => i.servico.nome),
        ],
        search
      );
      return dateOk && searchOk;
    });
  }, [relatorios, search, dateFrom, dateTo]);

  const remove = async (id: string) => {
    if (!confirm("Excluir este relatório?")) return;
    await fetch(`/api/relatorios/${id}`, { method: "DELETE" });
    load();
  };

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-muted">
            {filtered.length} de {relatorios.length} registro(s)
          </p>
        </div>
        <Link href="/admin/relatorios/novo">
          <Button>
            <Plus className="h-4 w-4" />
            Novo Relatório
          </Button>
        </Link>
      </div>

      <ListFilters
        search={search}
        onSearchChange={setSearch}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        searchPlaceholder="Cliente, técnico, serviço ou nº..."
        onClear={clearFilters}
      />

      {filtered.length === 0 ? (
        <Card className="text-center py-8 text-muted">
          {relatorios.length === 0
            ? "Nenhum relatório cadastrado"
            : "Nenhum relatório encontrado com os filtros aplicados"}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Link
                  href={`/admin/relatorios/${r.id}`}
                  className="flex-1 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">
                      #{String(r.numero).padStart(4, "0")}
                    </p>
                    <Badge
                      variant={
                        r.status === "FINALIZADO" ? "success" : "warning"
                      }
                    >
                      {r.status === "FINALIZADO" ? "Finalizado" : "Rascunho"}
                    </Badge>
                  </div>
                  <p className="text-sm">
                    {r.cliente?.nome || "Cliente pendente"} — Registrado por:{" "}
                    {r.tecnico.nome}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDateTime(r.dataInicio)}
                    {r.enderecoServico && ` • ${r.enderecoServico}`}
                  </p>
                  <p className="text-xs text-muted">
                    {r.itens.length} serviço(s) •{" "}
                    {r.itens.reduce((sum, i) => sum + i.fotos.length, 0)} foto(s)
                  </p>
                </Link>
                <div className="flex gap-2">
                  <Link href={`/admin/relatorios/${r.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                  </Link>
                  {r.status === "FINALIZADO" && r.cliente && (
                    <a href={`/api/pdf/relatorio/${r.id}`} target="_blank">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => remove(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ListFilters } from "@/components/admin/ListFilters";
import Link from "next/link";
import { Download, Trash2, Plus, MessageCircle, Copy } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calcOrcamentoTotal } from "@/lib/orcamento";
import { isInDateRange, matchesSearch } from "@/lib/adminFilters";
import {
  copiarLinkAssinatura,
  enviarWhatsAppAssinatura,
  obterTokenOrcamento,
} from "@/lib/shareAssinatura";

interface Orcamento {
  id: string;
  numero: number;
  status: string;
  desconto: number;
  valorFinal?: number | null;
  assinaturaCliente?: string | null;
  tokenAssinatura?: string | null;
  createdAt: string;
  cliente: { nome: string; telefone?: string | null };
  criadoPor: { nome: string };
  itens: Array<{
    quantidade: number;
    precoUnitario: number;
    servico: { nome: string };
  }>;
}

export default function OrcamentosAdminPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sharingId, setSharingId] = useState<string | null>(null);

  const load = () => {
    fetch("/api/orcamentos")
      .then((r) => r.json())
      .then(setOrcamentos);
  };

  useEffect(() => {
    load();
  }, []);

  const calcTotal = (o: Orcamento) =>
    calcOrcamentoTotal(o.itens, o.desconto, o.valorFinal);

  const filtered = useMemo(() => {
    return orcamentos.filter((o) => {
      const dateOk = isInDateRange(o.createdAt, dateFrom, dateTo);
      const searchOk = matchesSearch(
        [
          o.cliente.nome,
          o.criadoPor.nome,
          String(o.numero),
          o.status,
          ...o.itens.map((i) => i.servico.nome),
        ],
        search
      );
      return dateOk && searchOk;
    });
  }, [orcamentos, search, dateFrom, dateTo]);

  const totalFiltrado = filtered.reduce((sum, o) => sum + calcTotal(o), 0);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/orcamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este orçamento?")) return;
    await fetch(`/api/orcamentos/${id}`, { method: "DELETE" });
    load();
  };

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  const shareLink = async (o: Orcamento) => {
    if (!o.cliente.telefone) {
      alert("Cadastre o telefone do cliente para enviar o link.");
      return;
    }

    setSharingId(o.id);
    try {
      const token = await obterTokenOrcamento(o.id, o.tokenAssinatura);
      enviarWhatsAppAssinatura({
        telefone: o.cliente.telefone,
        tipo: "orcamento",
        numero: o.numero,
        nomeCliente: o.cliente.nome,
        token,
        total: formatCurrency(calcTotal(o)),
      });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar link");
    } finally {
      setSharingId(null);
    }
  };

  const copyLink = async (o: Orcamento) => {
    setSharingId(o.id);
    try {
      const token = await obterTokenOrcamento(o.id, o.tokenAssinatura);
      await copiarLinkAssinatura(token);
      alert("Link copiado!");
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao copiar link");
    } finally {
      setSharingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orçamentos</h1>
          <p className="text-sm text-muted">
            {filtered.length} de {orcamentos.length} registro(s)
            {filtered.length > 0 && (
              <> • Total filtrado: {formatCurrency(totalFiltrado)}</>
            )}
          </p>
        </div>
        <Link href="/admin/orcamentos/novo">
          <Button>
            <Plus className="h-4 w-4" />
            Novo Orçamento
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
        searchPlaceholder="Cliente, serviço ou nº..."
        onClear={clearFilters}
      />

      {filtered.length === 0 ? (
        <Card className="text-center py-8 text-muted">
          {orcamentos.length === 0
            ? "Nenhum orçamento cadastrado"
            : "Nenhum orçamento encontrado com os filtros aplicados"}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => (
            <Card key={o.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">
                      #{String(o.numero).padStart(4, "0")}
                    </p>
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
                  <p className="text-sm">{o.cliente.nome}</p>
                  <p className="text-xs text-muted">
                    {formatDate(o.createdAt)} — {o.criadoPor.nome}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(calcTotal(o))}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="w-36"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="APROVADO">Aprovado</option>
                    <option value="RECUSADO">Recusado</option>
                  </Select>
                  {!o.assinaturaCliente && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareLink(o)}
                        disabled={sharingId === o.id}
                        title="Enviar link de assinatura pelo WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(o)}
                        disabled={sharingId === o.id}
                        title="Copiar link de assinatura"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <a href={`/api/pdf/orcamento/${o.id}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => remove(o.id)}
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

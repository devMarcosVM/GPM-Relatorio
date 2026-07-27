"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calcOrcamentoTotal } from "@/lib/orcamento";
import {
  formatQuantidade,
  normalizeUnidade,
} from "@/lib/unidade";

interface Orcamento {
  id: string;
  numero: number;
  status: string;
  desconto: number;
  valorFinal?: number | null;
  formaPagamento?: string | null;
  observacoes?: string | null;
  assinaturaCliente?: string | null;
  assinaturaTecnico?: string | null;
  createdAt: string;
  cliente: { nome: string; telefone?: string | null };
  criadoPor: { nome: string };
  itens: Array<{
    quantidade: number;
    precoUnitario: number;
    servico: { nome: string; unidade?: string | null };
  }>;
}

export default function AdminOrcamentoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`/api/orcamentos/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setOrcamento(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (status: string) => {
    await fetch(`/api/orcamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const excluir = async () => {
    if (!confirm("Excluir este orçamento?")) return;
    await fetch(`/api/orcamentos/${id}`, { method: "DELETE" });
    router.push("/admin/orcamentos");
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-muted">Carregando...</div>
    );
  }

  if (!orcamento) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">Orçamento não encontrado</p>
        <Link href="/admin/orcamentos">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
    );
  }

  if (orcamento.status === "RASCUNHO") {
    return (
      <div className="space-y-4">
        <p className="text-muted">Este orçamento ainda é um rascunho.</p>
        <Link href={`/admin/orcamentos/${id}/editar`}>
          <Button>Continuar editando</Button>
        </Link>
        <Link href="/admin/orcamentos">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
    );
  }

  const total = calcOrcamentoTotal(
    orcamento.itens,
    orcamento.desconto,
    orcamento.valorFinal
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/admin/orcamentos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold sm:text-2xl">
                Orçamento #{String(orcamento.numero).padStart(4, "0")}
              </h1>
              <Badge variant="default">{orcamento.status}</Badge>
            </div>
            <p className="text-sm text-muted">
              {formatDate(orcamento.createdAt)} — {orcamento.criadoPor.nome}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={orcamento.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="w-full sm:w-36"
          >
            <option value="PENDENTE">Pendente</option>
            <option value="APROVADO">Aprovado</option>
            <option value="RECUSADO">Recusado</option>
          </Select>
          <a href={`/api/pdf/orcamento/${id}`} target="_blank">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </a>
          <Button variant="danger" size="sm" onClick={excluir}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="space-y-3">
        <p className="font-medium">{orcamento.cliente.nome}</p>
        {orcamento.cliente.telefone && (
          <p className="text-sm text-muted">{orcamento.cliente.telefone}</p>
        )}
        <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
        {orcamento.formaPagamento && (
          <p className="text-sm">
            <span className="font-medium">Pagamento: </span>
            {orcamento.formaPagamento}
          </p>
        )}
        {orcamento.observacoes && (
          <p className="text-sm whitespace-pre-wrap">{orcamento.observacoes}</p>
        )}
        <ul className="space-y-1 border-t pt-3 text-sm">
          {orcamento.itens.map((item, i) => {
            const unidade = normalizeUnidade(item.servico.unidade);
            return (
              <li key={i}>
                {item.servico.nome}{" "}
                {formatQuantidade(item.quantidade, unidade)} ×{" "}
                {formatCurrency(item.precoUnitario)} ={" "}
                {formatCurrency(item.precoUnitario * item.quantidade)}
              </li>
            );
          })}
        </ul>
      </Card>

      {(orcamento.assinaturaTecnico || orcamento.assinaturaCliente) && (
        <Card className="space-y-3">
          <h2 className="font-semibold">Assinaturas</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {orcamento.assinaturaTecnico && (
              <div>
                <p className="mb-1 text-xs text-muted">Técnico</p>
                <img
                  src={orcamento.assinaturaTecnico}
                  alt="Assinatura técnico"
                  className="h-20 w-full rounded border object-contain bg-white"
                />
              </div>
            )}
            {orcamento.assinaturaCliente && (
              <div>
                <p className="mb-1 text-xs text-muted">Cliente</p>
                <img
                  src={orcamento.assinaturaCliente}
                  alt="Assinatura cliente"
                  className="h-20 w-full rounded border object-contain bg-white"
                />
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

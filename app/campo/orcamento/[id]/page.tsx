"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignaturePad, type SignaturePadRef } from "@/components/SignaturePad";
import {
  ArrowLeft,
  Download,
  MessageCircle,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calcOrcamentoTotal } from "@/lib/orcamento";
import {
  formatQuantidade,
  normalizeUnidade,
} from "@/lib/unidade";
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
  assinaturaTecnico?: string | null;
  tokenAssinatura?: string | null;
  createdAt: string;
  cliente: { nome: string; telefone?: string | null };
  itens: Array<{
    quantidade: number;
    precoUnitario: number;
    servico: { nome: string; unidade?: string | null };
  }>;
}

export default function CampoOrcamentoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const assinaturaRef = useRef<SignaturePadRef>(null);
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [salvandoAssinatura, setSalvandoAssinatura] = useState(false);
  const [assinaturaErro, setAssinaturaErro] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

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

  useEffect(() => {
    if (copyState === "idle") return;
    const timeout = setTimeout(() => setCopyState("idle"), 2000);
    return () => clearTimeout(timeout);
  }, [copyState]);

  const total = orcamento
    ? calcOrcamentoTotal(orcamento.itens, orcamento.desconto, orcamento.valorFinal)
    : 0;

  const shareWhatsApp = async () => {
    if (!orcamento?.cliente.telefone) {
      alert("Cadastre o telefone do cliente.");
      return;
    }

    setSharing(true);
    try {
      const token = await obterTokenOrcamento(orcamento.id, orcamento.tokenAssinatura);
      enviarWhatsAppAssinatura({
        telefone: orcamento.cliente.telefone,
        tipo: "orcamento",
        numero: orcamento.numero,
        nomeCliente: orcamento.cliente.nome,
        token,
        total: formatCurrency(total),
      });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSharing(false);
    }
  };

  const copyLink = async () => {
    if (!orcamento) return;
    setSharing(true);
    try {
      const token = await obterTokenOrcamento(orcamento.id, orcamento.tokenAssinatura);
      await copiarLinkAssinatura(token);
      setCopyState("copied");
      load();
    } catch {
      setCopyState("error");
    } finally {
      setSharing(false);
    }
  };

  const salvarAssinaturaTecnico = async () => {
    setAssinaturaErro("");
    const sig = assinaturaRef.current?.exportSignature();
    if (!sig) {
      setAssinaturaErro("Desenhe sua assinatura antes de salvar.");
      return;
    }

    setSalvandoAssinatura(true);
    const res = await fetch(`/api/orcamentos/${id}/assinatura-tecnico`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assinaturaTecnico: sig }),
    });
    const data = await res.json().catch(() => null);
    setSalvandoAssinatura(false);

    if (!res.ok) {
      setAssinaturaErro(data?.error || "Erro ao salvar assinatura");
      return;
    }

    setOrcamento(data);
  };

  const excluirOrcamento = async () => {
    if (!confirm("Excluir este orçamento? Esta ação não pode ser desfeita.")) return;
    const res = await fetch(`/api/orcamentos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Erro ao excluir");
      return;
    }
    router.push("/campo/orcamentos");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Carregando...
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="p-4">
        <p className="text-red-600">Orçamento não encontrado</p>
        <Link href="/campo/orcamentos">
          <Button variant="ghost" className="mt-2">
            Voltar
          </Button>
        </Link>
      </div>
    );
  }

  if (orcamento.status === "RASCUNHO") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-sm text-muted">Este orçamento ainda é um rascunho.</p>
        <Link href={`/campo/orcamento/${id}/editar`}>
          <Button>Continuar editando</Button>
        </Link>
        <Button variant="danger" onClick={excluirOrcamento}>
          <Trash2 className="h-4 w-4" />
          Excluir rascunho
        </Button>
        <Link href="/campo/orcamentos">
          <Button variant="ghost">Voltar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-primary px-4 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
          <Link href="/campo/orcamentos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-sm opacity-80">Orçamento</p>
            <p className="font-semibold">
              #{String(orcamento.numero).padStart(4, "0")}
            </p>
          </div>
          </div>
          <button
            type="button"
            onClick={excluirOrcamento}
            className="rounded p-1 text-white/90 hover:bg-white/10"
            aria-label="Excluir orçamento"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 p-4">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium">{orcamento.cliente.nome}</p>
            <Badge
              variant={
                orcamento.assinaturaCliente || orcamento.status === "APROVADO"
                  ? "success"
                  : "warning"
              }
            >
              {orcamento.assinaturaCliente ? "Assinado" : orcamento.status}
            </Badge>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
          <p className="text-xs text-muted">{formatDate(orcamento.createdAt)}</p>

          <ul className="space-y-1 text-sm">
            {orcamento.itens.map((item, i) => {
              const unidade = normalizeUnidade(item.servico.unidade);
              return (
              <li key={i}>
                {item.servico.nome}{" "}
                {formatQuantidade(item.quantidade, unidade)} —{" "}
                {formatCurrency(item.precoUnitario * item.quantidade)}
              </li>
            )})}
          </ul>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-medium">Assinatura do técnico</h2>
          {orcamento.assinaturaTecnico ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Check className="h-4 w-4" />
                Assinatura do técnico registrada
              </div>
              <img
                src={orcamento.assinaturaTecnico}
                alt="Assinatura do técnico"
                className="h-20 w-full rounded-lg border border-border bg-white object-contain"
              />
            </div>
          ) : (
            <>
              <p className="text-xs text-muted">
                Pode assinar agora ou depois — não é obrigatório para enviar ao
                cliente.
              </p>
              <SignaturePad
                ref={assinaturaRef}
                label="Sua assinatura"
                onSave={() => {}}
              />
              {assinaturaErro && (
                <p className="text-sm text-red-600" role="alert">
                  {assinaturaErro}
                </p>
              )}
              <Button
                className="w-full"
                onClick={salvarAssinaturaTecnico}
                disabled={salvandoAssinatura}
              >
                {salvandoAssinatura ? "Salvando..." : "Salvar assinatura"}
              </Button>
            </>
          )}
        </Card>

        <Card className="space-y-2">
          <a href={`/api/pdf/orcamento/${id}`} target="_blank">
            <Button className="w-full" variant="outline">
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
          </a>

          {!orcamento.assinaturaCliente && (
            <>
              {orcamento.cliente.telefone && (
                <Button className="w-full" onClick={shareWhatsApp} disabled={sharing}>
                  <MessageCircle className="h-4 w-4" />
                  Enviar link para cliente assinar
                </Button>
              )}
              <Button
                className="w-full"
                variant="outline"
                onClick={copyLink}
                disabled={sharing}
              >
                {copyState === "copied" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copyState === "copied"
                  ? "Link copiado"
                  : copyState === "error"
                    ? "Erro ao copiar"
                    : "Copiar link de assinatura"}
              </Button>
            </>
          )}

          {orcamento.assinaturaCliente && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Check className="h-4 w-4" />
              Cliente já assinou este orçamento
            </div>
          )}

          <Button variant="danger" className="w-full" onClick={excluirOrcamento}>
            <Trash2 className="h-4 w-4" />
            Excluir orçamento
          </Button>
        </Card>
      </main>
    </div>
  );
}

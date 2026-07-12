"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  MessageCircle,
  Copy,
  Check,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calcOrcamentoTotal } from "@/lib/orcamento";
import {
  copiarLinkAssinatura,
  enviarWhatsAppAssinatura,
  obterTokenOrcamento,
} from "@/lib/shareAssinatura";
import { isIpUrl, buildAssinaturaUrl } from "@/lib/assinaturaLink";

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
  itens: Array<{
    quantidade: number;
    precoUnitario: number;
    servico: { nome: string };
  }>;
}

export default function CampoOrcamentoPage() {
  const { id } = useParams<{ id: string }>();
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

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
      alert("Link copiado!");
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao copiar");
    } finally {
      setSharing(false);
    }
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

  const linkAtual = orcamento.tokenAssinatura
    ? buildAssinaturaUrl(orcamento.tokenAssinatura, window.location.origin)
    : null;
  const linkIp = linkAtual ? isIpUrl(linkAtual) : false;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-primary px-4 py-4 text-white">
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
            {orcamento.itens.map((item, i) => (
              <li key={i}>
                {item.servico.nome} x{item.quantidade} —{" "}
                {formatCurrency(item.precoUnitario * item.quantidade)}
              </li>
            ))}
          </ul>
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
                <Copy className="h-4 w-4" />
                Copiar link de assinatura
              </Button>
              {linkIp && (
                <p className="text-xs text-amber-700">
                  Links com IP (rede local/Tailscale) podem não ficar azuis no WhatsApp.
                  Use &quot;Copiar link&quot; se o cliente não conseguir clicar.
                </p>
              )}
            </>
          )}

          {orcamento.assinaturaCliente && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Check className="h-4 w-4" />
              Cliente já assinou este orçamento
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

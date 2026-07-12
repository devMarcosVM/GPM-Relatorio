"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ClienteSearchSelect } from "@/components/cliente/ClienteSearchSelect";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Minus, Trash2, Download, MessageCircle, Copy, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { calcOrcamentoSubtotal, calcOrcamentoTotal, calcDescontoPacote } from "@/lib/orcamento";
import {
  buildAssinaturaUrl,
  buildAssinaturaWhatsAppMessage,
  isIpUrl,
} from "@/lib/assinaturaLink";
import { copiarLinkAssinatura } from "@/lib/shareAssinatura";

interface Cliente {
  id: string;
  nome: string;
  telefone?: string | null;
}

interface Servico {
  id: string;
  nome: string;
  preco: number;
}

interface ItemOrcamento {
  servicoId: string;
  servicoNome: string;
  quantidade: number;
  precoUnitario: number;
  precoCatalogo: number;
}

interface OrcamentoFormProps {
  backHref: string;
  backLabel?: string;
}

const FORMAS_PAGAMENTO = [
  { value: "PIX", label: "PIX" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "DEBITO", label: "Cartão de débito" },
  { value: "CREDITO", label: "Cartão de crédito" },
  { value: "BOLETO", label: "Boleto" },
  { value: "TRANSFERENCIA", label: "Transferência bancária" },
] as const;

type FormaPagamentoTipo = (typeof FORMAS_PAGAMENTO)[number]["value"];

function formatFormaPagamento(tipo: FormaPagamentoTipo | "", parcelas: number): string {
  switch (tipo) {
    case "PIX":
      return "PIX";
    case "DINHEIRO":
      return "Dinheiro";
    case "DEBITO":
      return "Cartão de débito";
    case "CREDITO":
      return `Cartão de crédito — ${parcelas}x`;
    case "BOLETO":
      return "Boleto";
    case "TRANSFERENCIA":
      return "Transferência bancária";
    default:
      return "";
  }
}

function parseMoney(value: string) {
  const parsed = parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function OrcamentoForm({ backHref, backLabel = "Voltar" }: OrcamentoFormProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [selectedServico, setSelectedServico] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [valorFinalPacote, setValorFinalPacote] = useState("");
  const [validadeDias, setValidadeDias] = useState(15);
  const [formaPagamentoTipo, setFormaPagamentoTipo] = useState<FormaPagamentoTipo | "">("");
  const [parcelasCredito, setParcelasCredito] = useState(1);
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  const [orcamentoId, setOrcamentoId] = useState<string | null>(null);
  const [orcamentoNumero, setOrcamentoNumero] = useState(0);
  const [tokenAssinatura, setTokenAssinatura] = useState<string | null>(null);
  const [totalSalvo, setTotalSalvo] = useState(0);
  const [error, setError] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    Promise.all([
      fetch("/api/clientes").then((r) => r.json()),
      fetch("/api/catalogo").then((r) => r.json()),
    ]).then(([c, s]) => {
      setClientes(c);
      setServicos(s);
    });
  }, []);

  useEffect(() => {
    if (copyState === "idle") return;
    const timeout = setTimeout(() => setCopyState("idle"), 2000);
    return () => clearTimeout(timeout);
  }, [copyState]);

  const addItem = () => {
    const servico = servicos.find((s) => s.id === selectedServico);
    if (!servico) return;
    setItens([
      ...itens,
      {
        servicoId: servico.id,
        servicoNome: servico.nome,
        quantidade: 1,
        precoUnitario: servico.preco,
        precoCatalogo: servico.preco,
      },
    ]);
    setSelectedServico("");
  };

  const removeItem = (idx: number) => {
    setItens(itens.filter((_, i) => i !== idx));
  };

  const updateQuantidade = (idx: number, quantidade: number) => {
    const updated = [...itens];
    updated[idx].quantidade = Math.max(1, quantidade);
    setItens(updated);
  };

  const updatePrecoUnitario = (idx: number, preco: number) => {
    const updated = [...itens];
    updated[idx].precoUnitario = Math.max(0, preco);
    setItens(updated);
  };

  const subtotal = calcOrcamentoSubtotal(itens);
  const valorFinal =
    valorFinalPacote.trim() === "" ? null : parseMoney(valorFinalPacote);
  const total = calcOrcamentoTotal(itens, desconto, valorFinal);
  const descontoValor = subtotal * (desconto / 100);
  const usaPacote = valorFinal != null;
  const descontoPacote =
    usaPacote && valorFinal != null
      ? calcDescontoPacote(subtotal, valorFinal)
      : 0;

  const criarOrcamento = async () => {
    if (!clienteId || itens.length === 0) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/orcamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId,
        desconto: usaPacote ? 0 : desconto,
        valorFinal: usaPacote ? valorFinal : null,
        validadeDias,
        formaPagamento: formatFormaPagamento(formaPagamentoTipo, parcelasCredito),
        observacoes,
        itens: itens.map((i) => ({
          servicoId: i.servicoId,
          quantidade: i.quantidade,
          precoUnitario: i.precoUnitario,
        })),
      }),
    });

    const orcamento = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok || !orcamento?.id) {
      setError(orcamento?.error || "Erro ao gerar orçamento");
      return;
    }

    setTotalSalvo(
      calcOrcamentoTotal(orcamento.itens, orcamento.desconto, orcamento.valorFinal)
    );
    setOrcamentoId(orcamento.id);
    setOrcamentoNumero(orcamento.numero);
    setTokenAssinatura(orcamento.tokenAssinatura || null);
  };

  const shareWhatsApp = () => {
    const cliente = clientes.find((c) => c.id === clienteId);
    const phone = cliente?.telefone?.replace(/\D/g, "") || "";
    if (!phone || !tokenAssinatura || !cliente) return;

    const texto = buildAssinaturaWhatsAppMessage({
      tipo: "orcamento",
      numero: orcamentoNumero,
      nomeCliente: cliente.nome,
      token: tokenAssinatura,
      origin: window.location.origin,
      total: formatCurrency(totalSalvo || total),
    });

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  const copyLink = async () => {
    if (!tokenAssinatura) return;
    try {
      await copiarLinkAssinatura(tokenAssinatura);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  if (orcamentoId) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Card className="space-y-4 text-center">
          <h2 className="text-lg font-semibold">Orçamento Criado!</h2>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(totalSalvo || total)}
          </p>
          <div className="flex flex-col gap-2">
            <a href={`/api/pdf/orcamento/${orcamentoId}`} target="_blank">
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4" />
                Baixar PDF
              </Button>
            </a>
            <Button className="w-full" onClick={shareWhatsApp}>
              <MessageCircle className="h-4 w-4" />
              Enviar link para cliente assinar
            </Button>
            <Button className="w-full" variant="outline" onClick={copyLink}>
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
            <p className="text-xs text-muted text-center">
              Também encontra o link em Campo → Orçamentos ou Admin → Orçamentos.
            </p>
            {tokenAssinatura && isIpUrl(buildAssinaturaUrl(tokenAssinatura, window.location.origin)) && (
              <p className="text-xs text-amber-700 text-center">
                Links com IP podem não ficar azuis no WhatsApp. Use &quot;Copiar link&quot;.
              </p>
            )}
            <Link href={backHref}>
              <Button variant="ghost" className="w-full">
                {backLabel}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Cliente *</label>
          <ClienteSearchSelect
            clientes={clientes}
            value={clienteId}
            onChange={setClienteId}
            placeholder="Buscar por nome, telefone ou documento..."
          />
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-medium">Serviços</h2>
        <p className="text-xs text-muted">
          O preço de cada serviço pode ser alterado — útil para pacotes e valores
          combinados.
        </p>
        <div className="flex gap-2">
          <Select
            value={selectedServico}
            onChange={(e) => setSelectedServico(e.target.value)}
            className="flex-1"
          >
            <option value="">Adicionar serviço</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} — {formatCurrency(s.preco)}
              </option>
            ))}
          </Select>
          <Button onClick={addItem} disabled={!selectedServico}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {itens.map((item, idx) => {
          const linhaTotal = item.quantidade * item.precoUnitario;
          const precoAlterado = item.precoUnitario !== item.precoCatalogo;

          return (
            <div
              key={idx}
              className="space-y-3 rounded-lg border border-border p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{item.servicoNome}</p>
                  <p className="text-xs text-muted">
                    Tabela: {formatCurrency(item.precoCatalogo)}
                    {precoAlterado && " • preço ajustado"}
                  </p>
                </div>
                <button onClick={() => removeItem(idx)} className="text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">
                    Qtd
                  </label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 shrink-0 px-0"
                      onClick={() => updateQuantidade(idx, item.quantidade - 1)}
                      disabled={item.quantidade <= 1}
                      aria-label="Diminuir quantidade"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantidade}
                      onChange={(e) =>
                        updateQuantidade(idx, parseInt(e.target.value) || 1)
                      }
                      className="text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 shrink-0 px-0"
                      onClick={() => updateQuantidade(idx, item.quantidade + 1)}
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">
                    Preço unit. (R$)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.precoUnitario}
                    onChange={(e) =>
                      updatePrecoUnitario(idx, parseMoney(e.target.value))
                    }
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-muted">
                    Total do item
                  </label>
                  <p className="flex h-10 items-center text-sm font-semibold">
                    {formatCurrency(linhaTotal)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-medium">Valores finais</h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Desconto (%)</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={desconto}
              disabled={usaPacote}
              onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Valor total do pacote (R$)
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={valorFinalPacote}
              placeholder="Ex: 850,00"
              onChange={(e) => setValorFinalPacote(e.target.value)}
            />
          </div>
        </div>

        <p className="text-xs text-muted">
          Use o valor do pacote quando fechar tudo por um preço único. Se
          preenchido, ele substitui o desconto percentual.
        </p>

        <div>
          <label className="mb-1 block text-sm font-medium">Validade (dias)</label>
          <Input
            type="number"
            min={1}
            value={validadeDias}
            onChange={(e) => setValidadeDias(parseInt(e.target.value) || 15)}
            className="max-w-xs"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Forma de pagamento</label>
          <Select
            value={formaPagamentoTipo}
            onChange={(e) =>
              setFormaPagamentoTipo(e.target.value as FormaPagamentoTipo | "")
            }
          >
            <option value="">Selecione...</option>
            {FORMAS_PAGAMENTO.map((forma) => (
              <option key={forma.value} value={forma.value}>
                {forma.label}
              </option>
            ))}
          </Select>
        </div>

        {formaPagamentoTipo === "CREDITO" && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Parcelas no cartão de crédito
            </label>
            <Select
              value={parcelasCredito}
              onChange={(e) => setParcelasCredito(parseInt(e.target.value) || 1)}
              className="max-w-xs"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}x
                </option>
              ))}
            </Select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium">Observações</label>
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={2}
          />
        </div>

        <div className="border-t pt-3 text-right space-y-1">
          <p className="text-sm text-muted">Subtotal: {formatCurrency(subtotal)}</p>
          {!usaPacote && desconto > 0 && (
            <p className="text-sm text-muted">
              Desconto ({desconto}%): -{formatCurrency(descontoValor)}
            </p>
          )}
          {usaPacote && descontoPacote > 0 && (
            <p className="text-sm text-muted">
              Desconto: -{formatCurrency(descontoPacote)}
            </p>
          )}
          <p className="text-xl font-bold text-primary">
            Total: {formatCurrency(total)}
          </p>
        </div>
      </Card>

      <Button
        className="w-full"
        size="lg"
        onClick={criarOrcamento}
        disabled={!clienteId || itens.length === 0 || loading}
      >
        {loading ? "Gerando..." : "Gerar Orçamento"}
      </Button>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
}

export function OrcamentoFormHeader({
  backHref,
  title = "Novo Orçamento",
}: {
  backHref: string;
  title?: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <Link href={backHref}>
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
}

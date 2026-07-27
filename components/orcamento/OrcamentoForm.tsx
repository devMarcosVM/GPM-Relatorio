"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ClienteSearchSelect } from "@/components/cliente/ClienteSearchSelect";
import {
  NovoClienteInline,
  type ClienteBasico,
} from "@/components/cliente/NovoClienteInline";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Minus, Trash2, Download, MessageCircle, Copy, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { telefoneParaWhatsApp } from "@/lib/documentosBr";
import {
  clampQuantidade,
  formatPrecoUnitario,
  formatQuantidade,
  formatQuantidadeInput,
  getQuantidadeInicial,
  getQuantidadeLabel,
  getQuantidadeMin,
  getQuantidadeStep,
  normalizeUnidade,
  validateQuantidadeInput,
  type UnidadeServico,
} from "@/lib/unidade";
import { calcOrcamentoSubtotal, calcOrcamentoTotal, calcDescontoPacote, validateDescontoInput } from "@/lib/orcamento";
import {
  buildAssinaturaWhatsAppMessage,
} from "@/lib/assinaturaLink";
import { copiarLinkAssinatura } from "@/lib/shareAssinatura";

interface Cliente extends ClienteBasico {}

interface Servico {
  id: string;
  nome: string;
  preco: number;
  unidade: string;
}

interface ItemOrcamento {
  servicoId: string;
  servicoNome: string;
  unidade: UnidadeServico;
  quantidade: number;
  quantidadeInput: string;
  quantidadeErro: string;
  precoUnitario: number;
  precoInput: string;
  precoCatalogo: number;
}

interface OrcamentoFormProps {
  backHref: string;
  backLabel?: string;
  /** ID de rascunho existente para continuar editando */
  orcamentoId?: string;
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

function parseFormaPagamento(value?: string | null): {
  tipo: FormaPagamentoTipo | "";
  parcelas: number;
} {
  if (!value) return { tipo: "", parcelas: 1 };
  const credito = value.match(/crédito\s*[—-]\s*(\d+)x/i);
  if (credito) {
    return { tipo: "CREDITO", parcelas: parseInt(credito[1], 10) || 1 };
  }
  const found = FORMAS_PAGAMENTO.find(
    (f) => value === f.label || value.startsWith(f.label)
  );
  return { tipo: found?.value ?? "", parcelas: 1 };
}

function parseMoney(value: string) {
  const parsed = parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function OrcamentoForm({
  backHref,
  backLabel = "Voltar",
  orcamentoId: orcamentoIdProp,
}: OrcamentoFormProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [selectedServico, setSelectedServico] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [descontoInput, setDescontoInput] = useState("0");
  const [descontoErro, setDescontoErro] = useState("");
  const [valorFinalPacote, setValorFinalPacote] = useState("");
  const [validadeDias, setValidadeDias] = useState(15);
  const [formaPagamentoTipo, setFormaPagamentoTipo] = useState<FormaPagamentoTipo | "">("");
  const [parcelasCredito, setParcelasCredito] = useState(1);
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(!!orcamentoIdProp);
  const [draftId, setDraftId] = useState<string | null>(orcamentoIdProp ?? null);
  const [orcamentoId, setOrcamentoId] = useState<string | null>(null);
  const [orcamentoNumero, setOrcamentoNumero] = useState(0);
  const [tokenAssinatura, setTokenAssinatura] = useState<string | null>(null);
  const [totalSalvo, setTotalSalvo] = useState(0);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
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
    if (!orcamentoIdProp) return;

    setLoadingDraft(true);
    fetch(`/api/orcamentos/${orcamentoIdProp}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Erro ao carregar");
        if (data.status !== "RASCUNHO") {
          throw new Error("Este orçamento já foi finalizado");
        }
        setDraftId(data.id);
        setOrcamentoNumero(data.numero);
        setClienteId(data.clienteId || data.cliente?.id || "");
        setDesconto(data.desconto || 0);
        setDescontoInput(String(data.desconto || 0));
        setValorFinalPacote(
          data.valorFinal != null ? String(data.valorFinal) : ""
        );
        setValidadeDias(data.validadeDias || 15);
        setObservacoes(data.observacoes || "");
        const forma = parseFormaPagamento(data.formaPagamento);
        setFormaPagamentoTipo(forma.tipo);
        setParcelasCredito(forma.parcelas);
        setItens(
          (data.itens || []).map(
            (item: {
              servicoId: string;
              quantidade: number;
              precoUnitario: number;
              servico: { nome: string; preco: number; unidade?: string | null };
            }) => {
              const unidade = normalizeUnidade(item.servico.unidade);
              return {
                servicoId: item.servicoId,
                servicoNome: item.servico.nome,
                unidade,
                quantidade: item.quantidade,
                quantidadeInput: formatQuantidadeInput(item.quantidade, unidade),
                quantidadeErro: "",
                precoUnitario: item.precoUnitario,
                precoInput: String(item.precoUnitario),
                precoCatalogo: item.servico.preco,
              };
            }
          )
        );
      })
      .catch((err) => setError(err.message || "Erro ao carregar rascunho"))
      .finally(() => setLoadingDraft(false));
  }, [orcamentoIdProp]);

  useEffect(() => {
    if (copyState === "idle") return;
    const timeout = setTimeout(() => setCopyState("idle"), 2000);
    return () => clearTimeout(timeout);
  }, [copyState]);

  useEffect(() => {
    if (!savedMsg) return;
    const timeout = setTimeout(() => setSavedMsg(""), 2500);
    return () => clearTimeout(timeout);
  }, [savedMsg]);

  const addItem = () => {
    const servico = servicos.find((s) => s.id === selectedServico);
    if (!servico) return;
    const unidade = normalizeUnidade(servico.unidade);
    const quantidade = getQuantidadeInicial(unidade);
    setItens([
      ...itens,
      {
        servicoId: servico.id,
        servicoNome: servico.nome,
        unidade,
        quantidade,
        quantidadeInput: formatQuantidadeInput(quantidade, unidade),
        quantidadeErro: "",
        precoUnitario: servico.preco,
        precoInput: String(servico.preco),
        precoCatalogo: servico.preco,
      },
    ]);
    setSelectedServico("");
  };

  const removeItem = (idx: number) => {
    setItens(itens.filter((_, i) => i !== idx));
  };

  const setQuantidadeInput = (idx: number, value: string) => {
    const updated = [...itens];
    updated[idx] = {
      ...updated[idx],
      quantidadeInput: value,
      quantidadeErro: "",
    };
    setItens(updated);
  };

  const commitQuantidade = (idx: number) => {
    const item = itens[idx];
    const result = validateQuantidadeInput(item.quantidadeInput, item.unidade);
    const updated = [...itens];

    if (!result.valid) {
      updated[idx] = { ...item, quantidadeErro: result.message };
      setItens(updated);
      return false;
    }

    updated[idx] = {
      ...item,
      quantidade: result.quantidade,
      quantidadeInput: result.display,
      quantidadeErro: "",
    };
    setItens(updated);
    return true;
  };

  const updateQuantidade = (idx: number, quantidade: number) => {
    const updated = [...itens];
    const unidade = updated[idx].unidade;
    const valor = clampQuantidade(quantidade, unidade);
    updated[idx] = {
      ...updated[idx],
      quantidade: valor,
      quantidadeInput: formatQuantidadeInput(valor, unidade),
      quantidadeErro: "",
    };
    setItens(updated);
  };

  const validarQuantidadesItens = () => {
    let ok = true;
    const updated = itens.map((item) => {
      const result = validateQuantidadeInput(item.quantidadeInput, item.unidade);
      if (!result.valid) {
        ok = false;
        return { ...item, quantidadeErro: result.message };
      }
      return {
        ...item,
        quantidade: result.quantidade,
        quantidadeInput: result.display,
        quantidadeErro: "",
      };
    });
    setItens(updated);
    return ok;
  };

  const updatePrecoInput = (idx: number, value: string) => {
    const updated = [...itens];
    updated[idx] = { ...updated[idx], precoInput: value };
    setItens(updated);
  };

  const commitPreco = (idx: number) => {
    const updated = [...itens];
    const preco = parseMoney(updated[idx].precoInput);
    updated[idx] = {
      ...updated[idx],
      precoUnitario: preco,
      precoInput: String(preco),
    };
    setItens(updated);
  };

  const subtotal = calcOrcamentoSubtotal(itens);
  const valorFinal =
    valorFinalPacote.trim() === "" ? null : parseMoney(valorFinalPacote);
  const usaPacote = valorFinal != null;
  const total = calcOrcamentoTotal(itens, usaPacote ? 0 : desconto, valorFinal);
  const descontoValor = subtotal * (desconto / 100);
  const descontoPacote =
    usaPacote && valorFinal != null
      ? calcDescontoPacote(subtotal, valorFinal)
      : 0;

  const validarDesconto = () => {
    if (usaPacote) {
      setDescontoErro("");
      return true;
    }
    const result = validateDescontoInput(descontoInput);
    if (!result.valid) {
      setDescontoErro(result.message);
      return false;
    }
    setDesconto(result.desconto);
    setDescontoInput(result.display);
    setDescontoErro("");
    return true;
  };

  const buildPayload = (opts: { rascunho?: boolean; finalizar?: boolean }) => ({
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
    ...opts,
  });

  const salvarRascunho = async () => {
    if (!clienteId) {
      setError("Selecione o cliente para salvar o rascunho.");
      return;
    }
    if (itens.length > 0 && !validarQuantidadesItens()) {
      setError("Corrija as quantidades dos serviços antes de salvar.");
      return;
    }
    if (!validarDesconto()) {
      setError("Corrija o desconto antes de salvar.");
      return;
    }

    setLoading(true);
    setError("");
    setSavedMsg("");

    const res = await fetch(
      draftId ? `/api/orcamentos/${draftId}` : "/api/orcamentos",
      {
        method: draftId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload({ rascunho: true })),
      }
    );

    const orcamento = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok || !orcamento?.id) {
      setError(orcamento?.error || "Erro ao salvar rascunho");
      return;
    }

    setDraftId(orcamento.id);
    setOrcamentoNumero(orcamento.numero);
    setSavedMsg("Rascunho salvo. Você pode continuar depois.");
  };

  const finalizarOrcamento = async () => {
    if (!clienteId || itens.length === 0) return;
    if (!validarQuantidadesItens()) {
      setError("Corrija as quantidades dos serviços antes de finalizar.");
      return;
    }
    if (!validarDesconto()) {
      setError("Corrija o desconto antes de finalizar.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(
      draftId ? `/api/orcamentos/${draftId}` : "/api/orcamentos",
      {
        method: draftId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          draftId
            ? buildPayload({ finalizar: true })
            : buildPayload({})
        ),
      }
    );

    const orcamento = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok || !orcamento?.id) {
      setError(orcamento?.error || "Erro ao finalizar orçamento");
      return;
    }

    setTotalSalvo(
      calcOrcamentoTotal(orcamento.itens, orcamento.desconto, orcamento.valorFinal)
    );
    setOrcamentoId(orcamento.id);
    setOrcamentoNumero(orcamento.numero);
    setTokenAssinatura(orcamento.tokenAssinatura || null);
    setDraftId(null);
  };

  const shareWhatsApp = () => {
    const cliente = clientes.find((c) => c.id === clienteId);
    const phone = cliente?.telefone ? telefoneParaWhatsApp(cliente.telefone) : "";
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

  if (loadingDraft) {
    return (
      <div className="py-12 text-center text-sm text-muted">
        Carregando rascunho...
      </div>
    );
  }

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
          <NovoClienteInline
            onCreated={(cliente) => {
              setClientes((prev) => [...prev, cliente]);
              setClienteId(cliente.id);
            }}
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
                {s.nome} — {formatPrecoUnitario(s.preco, normalizeUnidade(s.unidade))}
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
                    Tabela:{" "}
                    {formatPrecoUnitario(item.precoCatalogo, item.unidade)}
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
                    {getQuantidadeLabel(item.unidade)}
                  </label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 shrink-0 px-0"
                      onClick={() =>
                        updateQuantidade(
                          idx,
                          item.quantidade - getQuantidadeStep(item.unidade)
                        )
                      }
                      disabled={item.quantidade <= getQuantidadeMin(item.unidade)}
                      aria-label="Diminuir quantidade"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={item.quantidadeInput}
                      onChange={(e) => setQuantidadeInput(idx, e.target.value)}
                      onBlur={() => commitQuantidade(idx)}
                      placeholder={
                        item.unidade === "METRO" ? "Ex: 12" : "Ex: 1"
                      }
                      className={`text-center ${
                        item.quantidadeErro ? "border-red-500" : ""
                      }`}
                      aria-invalid={!!item.quantidadeErro}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 shrink-0 px-0"
                      onClick={() =>
                        updateQuantidade(
                          idx,
                          item.quantidade + getQuantidadeStep(item.unidade)
                        )
                      }
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {item.quantidadeErro && (
                    <p className="mt-1 text-xs text-red-600" role="alert">
                      {item.quantidadeErro}
                    </p>
                  )}
                  {item.unidade === "METRO" && !item.quantidadeErro && (
                    <p className="mt-1 text-xs text-muted">
                      {formatQuantidade(item.quantidade, item.unidade)} ×{" "}
                      {formatPrecoUnitario(item.precoUnitario, item.unidade)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">
                    {item.unidade === "METRO" ? "Preço por metro (R$)" : "Preço unit. (R$)"}
                  </label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={item.precoInput}
                    onChange={(e) => updatePrecoInput(idx, e.target.value)}
                    onBlur={() => commitPreco(idx)}
                    placeholder="0"
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
              type="text"
              inputMode="decimal"
              value={descontoInput}
              disabled={usaPacote}
              placeholder="Ex: 10"
              onChange={(e) => {
                setDescontoInput(e.target.value);
                setDescontoErro("");
              }}
              onBlur={validarDesconto}
              className={descontoErro ? "border-red-500" : ""}
              aria-invalid={!!descontoErro}
            />
            {descontoErro && !usaPacote && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {descontoErro}
              </p>
            )}
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

      <div className="space-y-2">
        <Button
          className="w-full"
          size="lg"
          variant="outline"
          onClick={salvarRascunho}
          disabled={!clienteId || loading}
        >
          {loading ? "Salvando..." : draftId ? "Atualizar rascunho" : "Salvar rascunho"}
        </Button>
        <Button
          className="w-full"
          size="lg"
          onClick={finalizarOrcamento}
          disabled={
            !clienteId ||
            itens.length === 0 ||
            loading ||
            itens.some((item) => item.quantidadeErro) ||
            (!usaPacote && !!descontoErro)
          }
        >
          {loading ? "Finalizando..." : "Finalizar orçamento"}
        </Button>
      </div>

      {savedMsg && (
        <p className="text-center text-sm text-green-700">{savedMsg}</p>
      )}
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      {draftId && !savedMsg && (
        <p className="text-center text-xs text-muted">
          Rascunho #{String(orcamentoNumero).padStart(4, "0")} — continue quando quiser
        </p>
      )}
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
      <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
    </div>
  );
}

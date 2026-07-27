"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Calculator,
  RotateCcw,
  Save,
  History,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  calcDescontoPacote,
  calcOrcamentoSubtotal,
  calcOrcamentoTotal,
  validateDescontoInput,
} from "@/lib/orcamento";
import {
  listarHistoricoCalculadora,
  removerCalculoDoHistorico,
  salvarCalculoNoHistorico,
  type CalculoSalvo,
} from "@/lib/calculadoraHistorico";
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

interface Servico {
  id: string;
  nome: string;
  preco: number;
  unidade: string;
}

interface ItemCalc {
  key: string;
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

function parseMoney(value: string) {
  const parsed = parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export default function CalculadoraCampoPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [selectedServico, setSelectedServico] = useState("");
  const [itens, setItens] = useState<ItemCalc[]>([]);
  const [desconto, setDesconto] = useState(0);
  const [descontoInput, setDescontoInput] = useState("0");
  const [descontoErro, setDescontoErro] = useState("");
  const [valorFinalPacote, setValorFinalPacote] = useState("");
  const [historico, setHistorico] = useState<CalculoSalvo[]>([]);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetch("/api/catalogo")
      .then((r) => r.json())
      .then(setServicos)
      .catch(() => setServicos([]));
    setHistorico(listarHistoricoCalculadora());
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(""), 2000);
    return () => clearTimeout(t);
  }, [feedback]);

  const addItem = () => {
    const servico = servicos.find((s) => s.id === selectedServico);
    if (!servico) return;
    const unidade = normalizeUnidade(servico.unidade);
    const quantidade = getQuantidadeInicial(unidade);
    setItens((prev) => [
      ...prev,
      {
        key: `${servico.id}-${Date.now()}`,
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

  const removeItem = (key: string) => {
    setItens((prev) => prev.filter((item) => item.key !== key));
  };

  const setQuantidadeInput = (key: string, value: string) => {
    setItens((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, quantidadeInput: value, quantidadeErro: "" }
          : item
      )
    );
  };

  const commitQuantidade = (key: string) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const result = validateQuantidadeInput(item.quantidadeInput, item.unidade);
        if (!result.valid) {
          return { ...item, quantidadeErro: result.message };
        }
        return {
          ...item,
          quantidade: result.quantidade,
          quantidadeInput: result.display,
          quantidadeErro: "",
        };
      })
    );
  };

  const updateQuantidade = (key: string, quantidade: number) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const valor = clampQuantidade(quantidade, item.unidade);
        return {
          ...item,
          quantidade: valor,
          quantidadeInput: formatQuantidadeInput(valor, item.unidade),
          quantidadeErro: "",
        };
      })
    );
  };

  const updatePrecoInput = (key: string, value: string) => {
    setItens((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, precoInput: value } : item
      )
    );
  };

  const commitPreco = (key: string) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const preco = parseMoney(item.precoInput);
        return {
          ...item,
          precoUnitario: preco,
          precoInput: String(preco),
        };
      })
    );
  };

  const limpar = () => {
    setItens([]);
    setDesconto(0);
    setDescontoInput("0");
    setDescontoErro("");
    setValorFinalPacote("");
    setSelectedServico("");
  };

  const salvarHistorico = () => {
    if (itens.length === 0) return;
    if (itens.some((item) => item.quantidadeErro)) {
      setFeedback("Corrija as quantidades antes de salvar");
      return;
    }
    if (!validarDesconto()) {
      setFeedback("Corrija o desconto antes de salvar");
      return;
    }

    const next = salvarCalculoNoHistorico({
      itens: itens.map((item) => ({
        servicoId: item.servicoId,
        servicoNome: item.servicoNome,
        unidade: item.unidade,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        precoCatalogo: item.precoCatalogo,
      })),
      desconto: usaPacote ? 0 : desconto,
      valorFinalPacote,
      subtotal,
      total,
    });
    setHistorico(next);
    setFeedback("Cálculo salvo nos últimos 3");
  };

  const restaurarCalculo = (calculo: CalculoSalvo) => {
    setItens(
      calculo.itens.map((item, index) => ({
        key: `${item.servicoId}-${calculo.id}-${index}`,
        servicoId: item.servicoId,
        servicoNome: item.servicoNome,
        unidade: item.unidade,
        quantidade: item.quantidade,
        quantidadeInput: formatQuantidadeInput(item.quantidade, item.unidade),
        quantidadeErro: "",
        precoUnitario: item.precoUnitario,
        precoInput: String(item.precoUnitario),
        precoCatalogo: item.precoCatalogo,
      }))
    );
    setDesconto(calculo.desconto);
    setDescontoInput(String(calculo.desconto));
    setDescontoErro("");
    setValorFinalPacote(calculo.valorFinalPacote || "");
    setSelectedServico("");
    setFeedback("Cálculo restaurado");
  };

  const apagarHistoricoItem = (id: string) => {
    setHistorico(removerCalculoDoHistorico(id));
  };

  const validarDesconto = () => {
    if (valorFinalPacote.trim() !== "") {
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-primary px-4 py-4 text-white">
        <div className="flex items-center gap-3">
          <Link href="/campo">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <p className="text-sm opacity-80">Campo</p>
            <p className="font-semibold">Calculadora</p>
          </div>
          {itens.length > 0 && (
            <button
              type="button"
              onClick={limpar}
              className="rounded-lg p-2 hover:bg-white/10"
              aria-label="Limpar"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 p-4">
        <Card className="space-y-2 border-dashed">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Cálculo rápido</p>
              <p className="text-xs text-muted">
                Monte o valor na hora.
              </p>
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-medium">Serviços</h2>
          <div className="flex gap-2">
            <Select
              value={selectedServico}
              onChange={(e) => setSelectedServico(e.target.value)}
              className="flex-1"
            >
              <option value="">Adicionar serviço</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} —{" "}
                  {formatPrecoUnitario(s.preco, normalizeUnidade(s.unidade))}
                </option>
              ))}
            </Select>
            <Button onClick={addItem} disabled={!selectedServico}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {itens.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">
              Adicione serviços do catálogo para calcular
            </p>
          ) : (
            itens.map((item) => {
              const linhaTotal = item.quantidade * item.precoUnitario;
              const precoAlterado = item.precoUnitario !== item.precoCatalogo;

              return (
                <div
                  key={item.key}
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
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="text-red-500"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
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
                              item.key,
                              item.quantidade - getQuantidadeStep(item.unidade)
                            )
                          }
                          disabled={
                            item.quantidade <= getQuantidadeMin(item.unidade)
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={item.quantidadeInput}
                          onChange={(e) =>
                            setQuantidadeInput(item.key, e.target.value)
                          }
                          onBlur={() => commitQuantidade(item.key)}
                          className={`text-center ${
                            item.quantidadeErro ? "border-red-500" : ""
                          }`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 shrink-0 px-0"
                          onClick={() =>
                            updateQuantidade(
                              item.key,
                              item.quantidade + getQuantidadeStep(item.unidade)
                            )
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {item.quantidadeErro && (
                        <p className="mt-1 text-xs text-red-600">
                          {item.quantidadeErro}
                        </p>
                      )}
                      {item.unidade === "METRO" && !item.quantidadeErro && (
                        <p className="mt-1 text-xs text-muted">
                          {formatQuantidade(item.quantidade, item.unidade)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">
                        {item.unidade === "METRO"
                          ? "Preço / m (R$)"
                          : "Preço (R$)"}
                      </label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={item.precoInput}
                        onChange={(e) =>
                          updatePrecoInput(item.key, e.target.value)
                        }
                        onBlur={() => commitPreco(item.key)}
                        placeholder="0"
                      />
                      <p className="mt-1 text-xs font-medium text-primary">
                        {formatCurrency(linhaTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </Card>

        {itens.length > 0 && (
          <Card className="space-y-3">
            <h2 className="font-medium">Ajustes</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Desconto (%)
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={descontoInput}
                  disabled={usaPacote}
                  onChange={(e) => {
                    setDescontoInput(e.target.value);
                    setDescontoErro("");
                  }}
                  onBlur={validarDesconto}
                  className={descontoErro ? "border-red-500" : ""}
                />
                {descontoErro && !usaPacote && (
                  <p className="mt-1 text-xs text-red-600">{descontoErro}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Valor pacote (R$)
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={valorFinalPacote}
                  placeholder="Opcional"
                  onChange={(e) => setValorFinalPacote(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1 border-t border-border pt-3 text-right">
              <p className="text-sm text-muted">
                Subtotal: {formatCurrency(subtotal)}
              </p>
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
              <p className="text-2xl font-bold text-primary">
                Total: {formatCurrency(total)}
              </p>
            </div>

            <Button className="w-full" onClick={salvarHistorico}>
              <Save className="h-4 w-4" />
              Salvar nos últimos 3
            </Button>
            {feedback && (
              <p className="text-center text-sm text-green-700">{feedback}</p>
            )}
          </Card>
        )}

        {historico.length > 0 && (
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted" />
              <h2 className="font-medium">Últimos cálculos</h2>
            </div>
            <div className="space-y-2">
              {historico.map((calculo) => (
                <div
                  key={calculo.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold text-primary">
                        {formatCurrency(calculo.total)}
                      </p>
                      <p className="text-xs text-muted">
                        {formatDateTime(calculo.savedAt)} —{" "}
                        {calculo.itens.length} serviço(s)
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {calculo.itens
                          .map((i) => i.servicoNome)
                          .slice(0, 3)
                          .join(", ")}
                        {calculo.itens.length > 3 ? "…" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => apagarHistoricoItem(calculo.id)}
                      className="text-red-500"
                      aria-label="Apagar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => restaurarCalculo(calculo)}
                  >
                    Usar de novo
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {feedback && itens.length === 0 && (
          <p className="text-center text-sm text-green-700">{feedback}</p>
        )}

        <p className="text-center text-xs text-muted">
          Para gerar orçamento com cliente e assinatura, use{" "}
          <Link href="/campo/orcamento/novo" className="text-primary underline">
            Novo orçamento
          </Link>
          .
        </p>
      </main>
    </div>
  );
}

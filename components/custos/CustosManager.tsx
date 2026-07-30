"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Trash2, WalletCards } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Custo {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  criadoPor: {
    id: string;
    nome: string;
    role: string;
  };
}

const today = () => new Date().toISOString().slice(0, 10);

export function CustosManager({ isAdmin = false }: { isAdmin?: boolean }) {
  const [custos, setCustos] = useState<Custo[]>([]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(today());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const response = await fetch("/api/custos");
    const body = await response.json();
    if (Array.isArray(body)) setCustos(body);
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/custos")
      .then((response) => response.json())
      .then((body) => {
        if (!cancelled && Array.isArray(body)) setCustos(body);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = useMemo(
    () => custos.reduce((sum, custo) => sum + custo.valor, 0),
    [custos]
  );

  const resetForm = () => {
    setDescricao("");
    setValor("");
    setData(today());
    setEditingId(null);
    setError("");
  };

  const save = async () => {
    setError("");
    const parsedValue = Number(valor.replace(",", "."));
    if (!descricao.trim()) {
      setError("Informe a descrição do custo");
      return;
    }
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      setError("Informe um valor válido");
      return;
    }

    setSaving(true);
    const response = await fetch(
      editingId ? `/api/custos/${editingId}` : "/api/custos",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: descricao.trim(),
          valor: parsedValue,
          data,
        }),
      }
    );
    const body = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(body.error || "Erro ao salvar custo");
      return;
    }

    resetForm();
    load();
  };

  const edit = (custo: Custo) => {
    setEditingId(custo.id);
    setDescricao(custo.descricao);
    setValor(String(custo.valor).replace(".", ","));
    setData(new Date(custo.data).toISOString().slice(0, 10));
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (custo: Custo) => {
    if (!confirm(`Excluir o custo "${custo.descricao}"?`)) return;
    const response = await fetch(`/api/custos/${custo.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      alert(body.error || "Erro ao excluir custo");
      return;
    }
    if (editingId === custo.id) resetForm();
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
          <WalletCards className="h-6 w-6 text-amber-600" />
          Custos
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isAdmin
            ? "Registre e acompanhe os gastos operacionais."
            : "Registre gasolina, ajudante, descarte e outros gastos."}
        </p>
      </div>

      <Card className="space-y-4">
        <h2 className="font-semibold">
          {editingId ? "Editar custo" : "Novo custo"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label className="mb-1 block text-sm font-medium">Descrição *</label>
            <Input
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Ex.: Gasolina, funcionário extra, descarte"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Valor *</label>
            <Input
              value={valor}
              onChange={(event) => setValor(event.target.value)}
              inputMode="decimal"
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Data *</label>
            <Input
              type="date"
              value={data}
              onChange={(event) => setData(event.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              onClick={save}
              disabled={saving || !descricao.trim()}
            >
              <Plus className="h-4 w-4" />
              {saving
                ? "Salvando..."
                : editingId
                  ? "Salvar alteração"
                  : "Adicionar custo"}
            </Button>
          </div>
        </div>
        {editingId && (
          <Button variant="outline" onClick={resetForm}>
            Cancelar edição
          </Button>
        )}
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </Card>

      <Card className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">
            {isAdmin ? "Gastos cadastrados" : "Meus gastos cadastrados"}
          </p>
          <p className="text-2xl font-bold text-amber-700">
            {formatCurrency(total)}
          </p>
        </div>
        <p className="text-sm text-muted">{custos.length} lançamento(s)</p>
      </Card>

      {custos.length === 0 ? (
        <Card className="py-8 text-center text-sm text-muted">
          Nenhum custo cadastrado
        </Card>
      ) : (
        <div className="space-y-2">
          {custos.map((custo) => (
            <Card
              key={custo.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium break-words">{custo.descricao}</p>
                <p className="font-semibold text-amber-700">
                  {formatCurrency(custo.valor)}
                </p>
                <p className="text-xs text-muted">
                  {formatDate(custo.data)}
                  {isAdmin && ` • Lançado por ${custo.criadoPor.nome}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => edit(custo)}
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => remove(custo)}
                  aria-label="Excluir custo"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

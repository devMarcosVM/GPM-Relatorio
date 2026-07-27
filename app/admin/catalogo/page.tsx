"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  UNIDADES_SERVICO,
  formatPrecoUnitario,
  normalizeUnidade,
  type UnidadeServico,
} from "@/lib/unidade";

interface Servico {
  id: string;
  nome: string;
  descricao?: string | null;
  preco: number;
  unidade: string;
  orientacaoFoto: string;
  ativo: boolean;
}

const emptyServico = {
  nome: "",
  descricao: "",
  preco: "",
  unidade: "UNIDADE" as UnidadeServico,
  orientacaoFoto: "VERTICAL",
};

export default function CatalogoPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [form, setForm] = useState(emptyServico);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    fetch("/api/catalogo?all=true")
      .then((r) => r.json())
      .then(setServicos);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.nome) return;

    const data = {
      nome: form.nome,
      descricao: form.descricao,
      preco: form.preco,
      unidade: form.unidade,
      orientacaoFoto: form.orientacaoFoto,
    };

    if (editingId) {
      await fetch(`/api/catalogo/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      await fetch("/api/catalogo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }

    setForm(emptyServico);
    setEditingId(null);
    setShowForm(false);
    load();
  };

  const edit = (servico: Servico) => {
    setForm({
      nome: servico.nome,
      descricao: servico.descricao || "",
      preco: String(servico.preco),
      unidade: normalizeUnidade(servico.unidade),
      orientacaoFoto: servico.orientacaoFoto,
    });
    setEditingId(servico.id);
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm("Desativar este serviço?")) return;
    await fetch(`/api/catalogo/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Catálogo de Serviços</h1>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setForm(emptyServico);
            setEditingId(null);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      {showForm && (
        <Card className="space-y-3">
          <h2 className="font-medium">
            {editingId ? "Editar Serviço" : "Novo Serviço"}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Nome do serviço *"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            <Input
              type="number"
              placeholder={form.unidade === "METRO" ? "Preço por metro (R$)" : "Preço (R$)"}
              value={form.preco}
              onChange={(e) => setForm({ ...form, preco: e.target.value })}
            />
            <Select
              value={form.unidade}
              onChange={(e) =>
                setForm({
                  ...form,
                  unidade: e.target.value as UnidadeServico,
                })
              }
            >
              {UNIDADES_SERVICO.map((unidade) => (
                <option key={unidade.value} value={unidade.value}>
                  {unidade.label}
                </option>
              ))}
            </Select>
            <Select
              value={form.orientacaoFoto}
              onChange={(e) =>
                setForm({ ...form, orientacaoFoto: e.target.value })
              }
            >
              <option value="VERTICAL">Foto Vertical</option>
              <option value="HORIZONTAL">Foto Horizontal</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Descrição técnica (aparece no PDF do relatório)
            </label>
            <Textarea
              placeholder="Ex.: Limpeza com caminhão de sucção a vácuo, retirada e descarte dos resíduos..."
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="w-full sm:w-auto" onClick={save}>
              Salvar
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {servicos.map((s) => (
          <Card
            key={s.id}
            className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium break-words">{s.nome}</p>
                <Badge variant="info">
                  {s.orientacaoFoto === "VERTICAL" ? "Vertical" : "Horizontal"}
                </Badge>
              </div>
              <p className="text-sm text-primary font-semibold">
                {formatPrecoUnitario(s.preco, normalizeUnidade(s.unidade))}
              </p>
              {s.descricao && (
                <p className="text-xs text-muted break-words">{s.descricao}</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => edit(s)}
                className="rounded-lg p-2 text-primary hover:bg-sky-50"
                aria-label="Editar"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => remove(s.id)}
                className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                aria-label="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ListFilters } from "@/components/admin/ListFilters";
import { Plus, Trash2, Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { isInDateRange, matchesSearch } from "@/lib/adminFilters";
import { formatDocumento, formatTelefone } from "@/lib/documentosBr";

interface Cliente {
  id: string;
  nome: string;
  documento?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  createdAt: string;
}

const emptyCliente = {
  nome: "",
  documento: "",
  telefone: "",
  email: "",
  endereco: "",
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState(emptyCliente);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [formError, setFormError] = useState("");

  const load = () => {
    fetch("/api/clientes")
      .then((r) => r.json())
      .then(setClientes);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return clientes.filter((c) => {
      const dateOk = isInDateRange(c.createdAt, dateFrom, dateTo);
      const searchOk = matchesSearch(
        [c.nome, c.documento, c.telefone, c.email, c.endereco],
        search
      );
      return dateOk && searchOk;
    });
  }, [clientes, search, dateFrom, dateTo]);

  const save = async () => {
    if (!form.nome) return;
    setFormError("");

    const res = editingId
      ? await fetch(`/api/clientes/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      : await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

    const data = await res.json();
    if (!res.ok) {
      setFormError(data.error || "Erro ao salvar cliente");
      return;
    }

    setForm(emptyCliente);
    setEditingId(null);
    setShowForm(false);
    load();
  };

  const edit = (cliente: Cliente) => {
    setForm({
      nome: cliente.nome,
      documento: formatDocumento(cliente.documento || ""),
      telefone: formatTelefone(cliente.telefone || ""),
      email: cliente.email || "",
      endereco: cliente.endereco || "",
    });
    setEditingId(cliente.id);
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este cliente?")) return;
    await fetch(`/api/clientes/${id}`, { method: "DELETE" });
    load();
  };

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted">
            {filtered.length} de {clientes.length} registro(s)
          </p>
        </div>
        <Button
          onClick={() => {
            setForm(emptyCliente);
            setEditingId(null);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <ListFilters
        search={search}
        onSearchChange={setSearch}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        searchPlaceholder="Nome, telefone, e-mail ou documento..."
        onClear={clearFilters}
      />

      {showForm && (
        <Card className="space-y-3">
          <h2 className="font-medium">
            {editingId ? "Editar Cliente" : "Novo Cliente"}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Nome / Razão social *"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            <Input
              placeholder="CPF/CNPJ"
              value={form.documento}
              onChange={(e) =>
                setForm({ ...form, documento: formatDocumento(e.target.value) })
              }
              onBlur={(e) =>
                setForm({ ...form, documento: formatDocumento(e.target.value) })
              }
            />
            <Input
              placeholder="Telefone"
              value={form.telefone}
              onChange={(e) =>
                setForm({ ...form, telefone: formatTelefone(e.target.value) })
              }
              onBlur={(e) =>
                setForm({ ...form, telefone: formatTelefone(e.target.value) })
              }
            />
            <Input
              placeholder="E-mail"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="Endereço"
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
              className="md:col-span-2"
            />
          </div>
          {formError && (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={save}>Salvar</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card className="text-center py-8 text-muted">
          {clientes.length === 0
            ? "Nenhum cliente cadastrado"
            : "Nenhum cliente encontrado com os filtros aplicados"}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Card key={c.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{c.nome}</p>
                <p className="text-sm text-muted">
                  {[c.documento, c.telefone, c.email].filter(Boolean).join(" • ")}
                </p>
                {c.endereco && (
                  <p className="text-xs text-muted">{c.endereco}</p>
                )}
                <p className="text-xs text-muted mt-1">
                  Cadastrado em {formatDate(c.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => edit(c)} className="text-primary">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(c.id)} className="text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

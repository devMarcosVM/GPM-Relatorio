"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDocumento, formatTelefone } from "@/lib/documentosBr";

export interface ClienteBasico {
  id: string;
  nome: string;
  telefone?: string | null;
  documento?: string | null;
  endereco?: string | null;
}

const emptyForm = {
  nome: "",
  documento: "",
  telefone: "",
  endereco: "",
};

interface NovoClienteInlineProps {
  onCreated: (cliente: ClienteBasico) => void;
  className?: string;
}

export function NovoClienteInline({ onCreated, className }: NovoClienteInlineProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.nome.trim()) return;
    setError("");
    setSaving(true);

    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const cliente = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(cliente.error || "Erro ao salvar cliente");
      return;
    }

    onCreated(cliente);
    setForm(emptyForm);
    setOpen(false);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="mt-2 flex items-center gap-1 text-sm text-primary"
      >
        <Plus className="h-4 w-4" />
        {open ? "Fechar cadastro" : "Cadastrar novo cliente"}
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-lg border border-border p-3">
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
            placeholder="Endereço"
            value={form.endereco}
            onChange={(e) => setForm({ ...form, endereco: e.target.value })}
          />
          <Button size="sm" onClick={save} disabled={saving || !form.nome.trim()}>
            {saving ? "Salvando..." : "Salvar Cliente"}
          </Button>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatDocumento, formatTelefone } from "@/lib/documentosBr";

const emptyForm = {
  nome: "",
  documento: "",
  telefone: "",
  endereco: "",
};

export default function NovoClienteCampoPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const save = async () => {
    if (!form.nome.trim()) {
      setError("Informe o nome do cliente");
      return;
    }

    setError("");
    setSaving(true);

    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Erro ao salvar cliente");
      return;
    }

    setSalvo(true);
  };

  if (salvo) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="flex items-center gap-3 border-b bg-white px-4 py-3">
          <Link href="/campo">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-semibold">Cliente cadastrado</h1>
        </header>
        <main className="mx-auto max-w-lg p-4">
          <Card className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold">{form.nome}</h2>
            <p className="text-sm text-muted">
              Cliente salvo. Você já pode usá-lo em relatórios e orçamentos.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full"
                onClick={() => {
                  setForm(emptyForm);
                  setSalvo(false);
                }}
              >
                <UserPlus className="h-4 w-4" />
                Cadastrar outro
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push("/campo")}>
                Voltar ao início
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center gap-3 border-b bg-white px-4 py-3">
        <Link href="/campo">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold">Novo cliente</h1>
      </header>

      <main className="mx-auto max-w-lg space-y-4 p-4">
        <Card className="space-y-3">
          <p className="text-sm text-muted">
            Cadastre o cliente para usar depois em relatórios e orçamentos.
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium">Nome / Razão social *</label>
            <Input
              placeholder="Nome completo"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">CPF / CNPJ</label>
            <Input
              placeholder="000.000.000-00"
              value={form.documento}
              onChange={(e) =>
                setForm({ ...form, documento: formatDocumento(e.target.value) })
              }
              onBlur={(e) =>
                setForm({ ...form, documento: formatDocumento(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Telefone</label>
            <Input
              placeholder="(00) 00000-0000"
              value={form.telefone}
              onChange={(e) =>
                setForm({ ...form, telefone: formatTelefone(e.target.value) })
              }
              onBlur={(e) =>
                setForm({ ...form, telefone: formatTelefone(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Endereço</label>
            <Input
              placeholder="Rua, número, bairro..."
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={save}
            disabled={saving || !form.nome.trim()}
          >
            {saving ? "Salvando..." : "Salvar cliente"}
          </Button>
        </Card>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Save,
  UserCog,
  ExternalLink,
  Building2,
  Upload,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  formatCnpj,
  formatTelefone,
  isEmpresaConfigured,
  validateEmpresa,
} from "@/lib/empresa";
import { toAssetPath } from "@/lib/assetUrl";

interface Empresa {
  id: string;
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
  logoUrl?: string | null;
}

const emptyForm = {
  razaoSocial: "",
  cnpj: "",
  endereco: "",
  telefone: "",
  email: "",
  logoUrl: "",
};

export default function ConfiguracoesPage() {
  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [configured, setConfigured] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    fetch("/api/empresa")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setForm({
            razaoSocial: data.razaoSocial || "",
            cnpj: data.cnpj || "",
            endereco: data.endereco || "",
            telefone: data.telefone || "",
            email: data.email || "",
            logoUrl: data.logoUrl || "",
          });
          setConfigured(isEmpresaConfigured(data));
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setError("");
    const validationError = validateEmpresa(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    const res = await fetch("/api/empresa", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Erro ao salvar");
      return;
    }

    setConfigured(isEmpresaConfigured(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const uploadLogo = async (file: File) => {
    setUploadingLogo(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/empresa/logo", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUploadingLogo(false);

    if (!res.ok) {
      setError(data.error || "Erro ao enviar logo");
      return;
    }

    setForm((prev) => ({ ...prev, logoUrl: data.logoUrl }));
  };

  const removeLogo = async () => {
    const res = await fetch("/api/empresa/logo", { method: "DELETE" });
    if (res.ok) {
      setForm((prev) => ({ ...prev, logoUrl: "" }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted">
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-7 w-7" />
          Dados da Empresa
        </h1>
        <p className="text-sm text-muted mt-1">
          Cadastre e edite aqui os dados que aparecem em relatórios e orçamentos
        </p>
      </div>

      {!configured && (
        <Card className="border-amber-200 bg-amber-50 max-w-2xl">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">
                Configure os dados da empresa
              </p>
              <p className="text-sm text-amber-800 mt-1">
                Preencha todos os campos abaixo. Eles serão usados automaticamente
                em todos os PDFs de relatório e orçamento.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2 max-w-5xl">
        <Card className="space-y-4">
          <h2 className="font-semibold">Informações cadastrais</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Razão Social *
              </label>
              <Input
                value={form.razaoSocial}
                onChange={(e) =>
                  setForm({ ...form, razaoSocial: e.target.value })
                }
                placeholder="Ex: Desentupidora Silva Ltda"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">CNPJ *</label>
                <Input
                  value={form.cnpj}
                  onChange={(e) =>
                    setForm({ ...form, cnpj: formatCnpj(e.target.value) })
                  }
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Telefone *
                </label>
                <Input
                  value={form.telefone}
                  onChange={(e) =>
                    setForm({ ...form, telefone: formatTelefone(e.target.value) })
                  }
                  placeholder="(11) 99999-0000"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Endereço *</label>
              <Input
                value={form.endereco}
                onChange={(e) =>
                  setForm({ ...form, endereco: e.target.value })
                }
                placeholder="Rua, número, bairro, cidade/UF"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">E-mail *</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contato@empresa.com.br"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : configured ? "Salvar alterações" : "Salvar dados da empresa"}
          </Button>

          {saved && (
            <p className="text-sm text-green-600">Dados salvos com sucesso!</p>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4">
            <h2 className="font-semibold">Logo da empresa</h2>
            <p className="text-sm text-muted">
              Opcional. Aparece no cabeçalho dos documentos.
            </p>

            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadLogo(file);
                e.target.value = "";
              }}
            />

            {form.logoUrl ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center rounded-lg border border-border bg-slate-50 p-6">
                  <img
                    src={toAssetPath(form.logoUrl)}
                    alt="Logo da empresa"
                    className="max-h-24 max-w-full object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    <Upload className="h-4 w-4" />
                    Trocar logo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeLogo}
                    disabled={uploadingLogo}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingLogo}
                className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-8 hover:border-primary transition-colors"
              >
                <Upload className="h-8 w-8 text-muted" />
                <span className="text-sm font-medium">
                  {uploadingLogo ? "Enviando..." : "Enviar logo"}
                </span>
                <span className="text-xs text-muted">PNG, JPG ou WebP</span>
              </button>
            )}
          </Card>

          <Card className="space-y-3">
            <h2 className="font-semibold text-sm">Prévia no documento</h2>
            <div className="rounded-lg border border-border p-4 text-sm">
              {form.logoUrl && (
                <img
                  src={toAssetPath(form.logoUrl)}
                  alt=""
                  className="mb-3 h-10 object-contain"
                />
              )}
              <p className="font-bold text-primary">
                {form.razaoSocial || "Razão Social da Empresa"}
              </p>
              {form.cnpj && <p className="text-muted">CNPJ: {form.cnpj}</p>}
              {form.endereco && <p className="text-muted">{form.endereco}</p>}
              {(form.telefone || form.email) && (
                <p className="text-muted">
                  {[form.telefone, form.email].filter(Boolean).join(" | ")}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card className="max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Usuários do Sistema
            </h2>
            <p className="text-sm text-muted mt-1">
              Cadastre técnicos e administradores
            </p>
          </div>
          <Link href="/admin/usuarios">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4" />
              Gerenciar
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, UserCog } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Usuario {
  id: string;
  email: string;
  nome: string;
  role: string;
  createdAt: string;
  _count?: { relatorios: number; orcamentos: number };
}

const emptyForm = {
  nome: "",
  email: "",
  password: "",
  role: "TECNICO",
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    fetch("/api/usuarios")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUsuarios(data);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (user: Usuario) => {
    setForm({
      nome: user.nome,
      email: user.email,
      password: "",
      role: user.role,
    });
    setEditingId(user.id);
    setError("");
    setShowForm(true);
  };

  const save = async () => {
    setLoading(true);
    setError("");

    const url = editingId ? `/api/usuarios/${editingId}` : "/api/usuarios";
    const method = editingId ? "PUT" : "POST";

    const body: Record<string, string> = {
      nome: form.nome,
      email: form.email,
      role: form.role,
    };

    if (form.password.trim()) {
      body.password = form.password;
    } else if (!editingId) {
      setError("Senha é obrigatória para novo usuário");
      setLoading(false);
      return;
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erro ao salvar");
      setLoading(false);
      return;
    }

    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    setLoading(false);
    load();
  };

  const remove = async (id: string, nome: string) => {
    if (!confirm(`Excluir o usuário "${nome}"?`)) return;

    const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao excluir");
      return;
    }

    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="h-7 w-7" />
            Usuários
          </h1>
          <p className="text-sm text-muted mt-1">
            Gerencie técnicos de campo e administradores do escritório
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {showForm && (
        <Card className="max-w-xl space-y-4">
          <h2 className="font-medium">
            {editingId ? "Editar Usuário" : "Novo Usuário"}
          </h2>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Nome *</label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">E-mail *</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@empresa.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                {editingId ? "Nova senha (opcional)" : "Senha *"}
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingId ? "Deixe vazio para manter" : "Mínimo 6 caracteres"}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Perfil *</label>
              <Select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="TECNICO">Técnico (campo)</option>
                <option value="ADMIN">Administrador (escritório)</option>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={save} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {usuarios.map((u) => (
          <Card key={u.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{u.nome}</p>
                <Badge variant={u.role === "ADMIN" ? "info" : "default"}>
                  {u.role === "ADMIN" ? "Admin" : "Técnico"}
                </Badge>
              </div>
              <p className="text-sm text-muted">{u.email}</p>
              <p className="text-xs text-muted">
                Cadastrado em {formatDate(u.createdAt)}
                {u._count && (
                  <> • {u._count.relatorios} relatório(s) • {u._count.orcamentos} orçamento(s)</>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => remove(u.id, u.nome)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

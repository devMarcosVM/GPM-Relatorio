"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ClienteSearchSelect } from "@/components/cliente/ClienteSearchSelect";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhotoUpload } from "@/components/relatorio/PhotoUpload";
import { SignaturePad, type SignaturePadRef } from "@/components/SignaturePad";
import {
  ArrowLeft,
  Download,
  Trash2,
  User,
  Calendar,
  FileText,
  Plus,
  Save,
  Pencil,
  Check,
  MessageCircle,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { toAssetPath } from "@/lib/assetUrl";
import { buildAssinaturaWhatsAppMessage } from "@/lib/assinaturaLink";
import type { OrientacaoFoto } from "@/lib/types";

interface Cliente {
  id: string;
  nome: string;
}

interface Servico {
  id: string;
  nome: string;
  orientacaoFoto: OrientacaoFoto;
}

interface Foto {
  id: string;
  tipo: string;
  url: string;
  orientacao: string;
}

interface Item {
  id: string;
  servico: Servico;
  observacoes?: string | null;
  fotos: Foto[];
}

interface Relatorio {
  id: string;
  numero: number;
  status: string;
  enderecoServico?: string | null;
  observacoes?: string | null;
  dataInicio: string;
  dataFim?: string | null;
  assinaturaTecnico?: string | null;
  assinaturaCliente?: string | null;
  tokenAssinatura?: string | null;
  clienteId?: string | null;
  cliente: {
    id: string;
    nome: string;
    documento?: string | null;
    telefone?: string | null;
    email?: string | null;
  } | null;
  tecnico: { nome: string; email: string };
  itens: Item[];
}

export default function AdminRelatorioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [finalizeError, setFinalizeError] = useState("");
  const [assinaturaTecnico, setAssinaturaTecnico] = useState<string | null>(null);
  const [assinaturaCliente, setAssinaturaCliente] = useState<string | null>(null);

  const [clienteId, setClienteId] = useState("");
  const [enderecoServico, setEnderecoServico] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [selectedServico, setSelectedServico] = useState("");
  const [itemObs, setItemObs] = useState<Record<string, string>>({});
  const assinaturaTecnicoRef = useRef<SignaturePadRef>(null);
  const assinaturaClienteRef = useRef<SignaturePadRef>(null);

  const load = useCallback(async () => {
    const [rRes, cRes, sRes] = await Promise.all([
      fetch(`/api/relatorios/${id}`),
      fetch("/api/clientes"),
      fetch("/api/catalogo"),
    ]);
    const data = await rRes.json();
    const c = await cRes.json();
    const s = await sRes.json();

    setRelatorio(data);
    setClientes(c);
    setServicos(s);
    setClienteId(data.clienteId || data.cliente?.id || "");
    setEnderecoServico(data.enderecoServico || "");
    setObservacoes(data.observacoes || "");

    const obs: Record<string, string> = {};
    data.itens?.forEach((item: Item) => {
      obs[item.id] = item.observacoes || "";
    });
    setItemObs(obs);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const saveInfo = async () => {
    setSaving(true);
    const res = await fetch(`/api/relatorios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId: clienteId || null,
        enderecoServico,
        observacoes,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      load();
    }
  };

  const saveItemObs = async (itemId: string) => {
    await fetch(`/api/relatorios/itens/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ observacoes: itemObs[itemId] || "" }),
    });
    load();
  };

  const addItem = async () => {
    if (!selectedServico) return;
    await fetch(`/api/relatorios/${id}/itens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ servicoId: selectedServico }),
    });
    setSelectedServico("");
    load();
  };

  const removeItem = async (itemId: string) => {
    if (!confirm("Remover este serviço e suas fotos?")) return;
    await fetch(`/api/relatorios/itens/${itemId}`, { method: "DELETE" });
    load();
  };

  const removeRelatorio = async () => {
    if (!confirm("Excluir este relatório?")) return;
    await fetch(`/api/relatorios/${id}`, { method: "DELETE" });
    router.push("/admin/relatorios");
  };

  const finalizar = async () => {
    setFinalizeError("");
    if (!clienteId) {
      setFinalizeError("Selecione o cliente contratante para finalizar");
      return;
    }

    setFinalizando(true);
    const sigTecnico =
      assinaturaTecnicoRef.current?.exportSignature() ?? assinaturaTecnico;
    const sigCliente =
      assinaturaClienteRef.current?.exportSignature() ?? assinaturaCliente;

    const res = await fetch(`/api/relatorios/${id}/finalizar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId,
        enderecoServico,
        observacoes,
        assinaturaTecnico: sigTecnico,
        assinaturaCliente: sigCliente,
      }),
    });

    const data = await res.json();
    setFinalizando(false);

    if (!res.ok) {
      setFinalizeError(data.error || "Erro ao finalizar");
      return;
    }

    load();
  };

  const shareWhatsApp = () => {
    if (!relatorio?.cliente?.telefone) return;
    const phone = relatorio.cliente.telefone.replace(/\D/g, "");

    let texto: string;
    if (relatorio.tokenAssinatura && !relatorio.assinaturaCliente) {
      texto = buildAssinaturaWhatsAppMessage({
        tipo: "relatorio",
        numero: relatorio.numero,
        nomeCliente: relatorio.cliente.nome,
        token: relatorio.tokenAssinatura,
        origin: window.location.origin,
      });
    } else {
      texto =
        `Relatório de Serviço #${String(relatorio.numero).padStart(4, "0")} — ${relatorio.cliente.nome}\n` +
        `PDF: ${window.location.origin}/api/pdf/relatorio/${id}`;
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted">
        Carregando...
      </div>
    );
  }

  if (!relatorio?.numero) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">Relatório não encontrado</p>
        <Link href="/admin/relatorios">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
    );
  }

  const totalFotos = relatorio.itens.reduce((sum, i) => sum + i.fotos.length, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/admin/relatorios">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                Relatório #{String(relatorio.numero).padStart(4, "0")}
              </h1>
              <Badge
                variant={relatorio.status === "FINALIZADO" ? "success" : "warning"}
              >
                {relatorio.status === "FINALIZADO" ? "Finalizado" : "Rascunho"}
              </Badge>
            </div>
            <p className="text-sm text-muted mt-1 flex items-center gap-1">
              <Pencil className="h-3.5 w-3.5" />
              Modo edição — {relatorio.itens.length} serviço(s) • {totalFotos} foto(s)
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {relatorio.status === "FINALIZADO" && relatorio.cliente && (
            <>
              <a href={`/api/pdf/relatorio/${id}`} target="_blank">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                  PDF
                </Button>
              </a>
              {relatorio.cliente.telefone && (
                <Button variant="outline" size="sm" onClick={shareWhatsApp}>
                  <MessageCircle className="h-4 w-4" />
                  {relatorio.tokenAssinatura && !relatorio.assinaturaCliente
                    ? "Link assinatura"
                    : "WhatsApp"}
                </Button>
              )}
            </>
          )}
          <Button variant="danger" size="sm" onClick={removeRelatorio}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <User className="h-4 w-4" />
          Registrado por
        </h2>
        <p className="text-sm">
          {relatorio.tecnico.nome}{" "}
          <span className="text-muted">({relatorio.tecnico.email})</span>
        </p>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Informações do relatório
        </h2>

        <div>
          <label className="mb-1 block text-sm font-medium">Cliente contratante</label>
          <ClienteSearchSelect
            clientes={clientes}
            value={clienteId}
            onChange={setClienteId}
            allowEmpty
            emptyLabel="Sem cliente / pendente"
            placeholder="Buscar por nome, telefone ou documento..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Endereço do serviço</label>
          <Input
            value={enderecoServico}
            onChange={(e) => setEnderecoServico(e.target.value)}
            placeholder="Local do serviço"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Observações gerais</label>
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={saveInfo} disabled={saving} size="sm">
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar informações"}
          </Button>
          {saved && <span className="text-sm text-green-600">Salvo!</span>}
        </div>

        <div className="text-xs text-muted flex items-center gap-2 pt-2 border-t">
          <Calendar className="h-3.5 w-3.5" />
          Início: {formatDateTime(relatorio.dataInicio)}
          {relatorio.dataFim && ` • Fim: ${formatDateTime(relatorio.dataFim)}`}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Adicionar serviço</h2>
        <div className="flex gap-2">
          <Select
            value={selectedServico}
            onChange={(e) => setSelectedServico(e.target.value)}
            className="flex-1"
          >
            <option value="">Selecione o tipo de serviço</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </Select>
          <Button onClick={addItem} disabled={!selectedServico} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <h2 className="font-semibold">Serviços e fotos (opcionais)</h2>

        {relatorio.itens.length === 0 ? (
          <Card className="text-center py-8 text-muted text-sm">
            Nenhum serviço adicionado
          </Card>
        ) : (
          relatorio.itens.map((item, idx) => {
            const fotoAntes = item.fotos.find((f) => f.tipo === "ANTES");
            const fotoDepois = item.fotos.find((f) => f.tipo === "DEPOIS");
            const orientacao = item.servico.orientacaoFoto as OrientacaoFoto;

            return (
              <Card key={item.id} className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">
                    {idx + 1}. {item.servico.nome}
                  </p>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">
                    Observações do serviço
                  </label>
                  <div className="flex gap-2">
                    <Textarea
                      value={itemObs[item.id] ?? ""}
                      onChange={(e) =>
                        setItemObs({ ...itemObs, [item.id]: e.target.value })
                      }
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => saveItemObs(item.id)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-muted">ANTES (opcional)</p>
                      <PhotoUpload
                        relatorioItemId={item.id}
                        tipo="ANTES"
                        orientacao={orientacao}
                        onComplete={load}
                        label={fotoAntes ? "Trocar" : "Adicionar"}
                      />
                    </div>
                    {fotoAntes ? (
                      <a href={toAssetPath(fotoAntes.url)} target="_blank" rel="noopener noreferrer">
                        <img
                          src={toAssetPath(fotoAntes.url)}
                          alt="Antes"
                          className="w-full rounded-lg border border-border object-cover max-h-64"
                        />
                      </a>
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-border text-xs text-muted">
                        Sem foto
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-muted">DEPOIS (opcional)</p>
                      <PhotoUpload
                        relatorioItemId={item.id}
                        tipo="DEPOIS"
                        orientacao={orientacao}
                        onComplete={load}
                        label={fotoDepois ? "Trocar" : "Adicionar"}
                      />
                    </div>
                    {fotoDepois ? (
                      <a href={toAssetPath(fotoDepois.url)} target="_blank" rel="noopener noreferrer">
                        <img
                          src={toAssetPath(fotoDepois.url)}
                          alt="Depois"
                          className="w-full rounded-lg border border-border object-cover max-h-64"
                        />
                      </a>
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-border text-xs text-muted">
                        Sem foto
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {relatorio.status !== "FINALIZADO" && (
        <Card className="space-y-4 border-primary/20 bg-sky-50/50">
          <h2 className="font-semibold">Finalizar relatório</h2>
          <p className="text-sm text-muted">
            Selecione o cliente e finalize para gerar o PDF. Serviços e fotos são
            opcionais.
          </p>

          <SignaturePad
            ref={assinaturaTecnicoRef}
            label="Assinatura do responsável"
            onSave={setAssinaturaTecnico}
          />

          <SignaturePad
            ref={assinaturaClienteRef}
            label="Assinatura do cliente (opcional)"
            onSave={setAssinaturaCliente}
          />

          {finalizeError && (
            <p className="text-sm text-red-600">{finalizeError}</p>
          )}

          <Button
            className="w-full sm:w-auto"
            onClick={finalizar}
            disabled={finalizando}
          >
            <Check className="h-4 w-4" />
            {finalizando ? "Finalizando..." : "Finalizar e Gerar PDF"}
          </Button>
        </Card>
      )}

      {(relatorio.assinaturaTecnico || relatorio.assinaturaCliente) && (
        <Card className="space-y-4">
          <h2 className="font-semibold">Assinaturas</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {relatorio.assinaturaTecnico && (
              <div>
                <p className="text-xs text-muted mb-2">Técnico</p>
                <img
                  src={relatorio.assinaturaTecnico}
                  alt="Assinatura técnico"
                  className="h-20 border border-border rounded"
                />
              </div>
            )}
            {relatorio.assinaturaCliente && (
              <div>
                <p className="text-xs text-muted mb-2">Cliente</p>
                <img
                  src={relatorio.assinaturaCliente}
                  alt="Assinatura cliente"
                  className="h-20 border border-border rounded"
                />
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ClienteSearchSelect } from "@/components/cliente/ClienteSearchSelect";
import { CameraCapture } from "@/components/camera/CameraCapture";
import { SignaturePad, type SignaturePadRef } from "@/components/SignaturePad";
import {
  ArrowLeft,
  Plus,
  Camera,
  Check,
  Download,
  Trash2,
  MessageCircle,
} from "lucide-react";
import type { OrientacaoFoto, TipoFoto } from "@/lib/types";

interface Cliente {
  id: string;
  nome: string;
  endereco?: string | null;
  telefone?: string | null;
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
  assinaturaTecnico?: string | null;
  assinaturaCliente?: string | null;
  cliente: Cliente | null;
  itens: Item[];
}

export default function RelatorioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedServico, setSelectedServico] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [enderecoServico, setEnderecoServico] = useState("");
  const [showNewCliente, setShowNewCliente] = useState(false);
  const [newCliente, setNewCliente] = useState({
    nome: "",
    documento: "",
    telefone: "",
    endereco: "",
  });
  const [camera, setCamera] = useState<{
    itemId: string;
    tipo: TipoFoto;
    orientacao: OrientacaoFoto;
    servicoNome: string;
  } | null>(null);
  const [step, setStep] = useState<"itens" | "finalizar" | "concluido">("itens");
  const [assinaturaTecnico, setAssinaturaTecnico] = useState<string | null>(null);
  const [assinaturaCliente, setAssinaturaCliente] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const [error, setError] = useState("");
  const [finalizando, setFinalizando] = useState(false);
  const assinaturaTecnicoRef = useRef<SignaturePadRef>(null);
  const assinaturaClienteRef = useRef<SignaturePadRef>(null);

  const load = useCallback(async () => {
    const [rRes, sRes, cRes] = await Promise.all([
      fetch(`/api/relatorios/${id}`),
      fetch("/api/catalogo"),
      fetch("/api/clientes"),
    ]);
    const r = await rRes.json();
    const s = await sRes.json();
    const c = await cRes.json();
    setRelatorio(r);
    setServicos(s);
    setClientes(c);
    setObservacoes(r.observacoes || "");
    setEnderecoServico(r.enderecoServico || "");
    if (r.cliente?.id) setClienteId(r.cliente.id);
    if (r.status === "FINALIZADO") setStep("concluido");
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const cliente = clientes.find((c) => c.id === clienteId);
    if (cliente?.endereco && !enderecoServico) {
      setEnderecoServico(cliente.endereco);
    }
  }, [clienteId, clientes, enderecoServico]);

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
    await fetch(`/api/relatorios/itens/${itemId}`, { method: "DELETE" });
    load();
  };

  const openCamera = (item: Item, tipo: TipoFoto) => {
    setCamera({
      itemId: item.id,
      tipo,
      orientacao: item.servico.orientacaoFoto as OrientacaoFoto,
      servicoNome: item.servico.nome,
    });
  };

  const criarCliente = async () => {
    if (!newCliente.nome.trim()) return;
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCliente),
    });
    const cliente = await res.json();
    setClientes([...clientes, cliente]);
    setClienteId(cliente.id);
    setShowNewCliente(false);
    setNewCliente({ nome: "", documento: "", telefone: "", endereco: "" });
  };

  const finalizar = async () => {
    setError("");
    if (!clienteId) {
      setError("Selecione o cliente contratante para gerar o relatório");
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
        assinaturaTecnico: sigTecnico,
        assinaturaCliente: sigCliente,
        observacoes,
      }),
    });

    const data = await res.json();
    setFinalizando(false);

    if (!res.ok) {
      setError(data.error || "Erro ao finalizar");
      return;
    }

    setStep("concluido");
    load();
  };

  const shareWhatsApp = () => {
    if (!relatorio?.cliente) return;
    const texto = encodeURIComponent(
      `Relatório de Serviço #${String(relatorio.numero).padStart(4, "0")} — ${relatorio.cliente.nome}\n` +
        `PDF: ${window.location.origin}/api/pdf/relatorio/${id}`
    );
    const phone = relatorio.cliente.telefone?.replace(/\D/g, "") || "";
    window.open(`https://wa.me/${phone}?text=${texto}`, "_blank");
  };

  if (!relatorio) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Carregando...</p>
      </div>
    );
  }

  if (camera) {
    return (
      <CameraCapture
        orientacao={camera.orientacao}
        tipo={camera.tipo}
        servicoNome={camera.servicoNome}
        relatorioItemId={camera.itemId}
        onComplete={() => {
          setCamera(null);
          load();
        }}
        onCancel={() => setCamera(null)}
      />
    );
  }

  const clienteNome = relatorio.cliente?.nome || "Cliente pendente";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/campo">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-semibold">
              Relatório #{String(relatorio.numero).padStart(4, "0")}
            </h1>
            <p className="text-xs text-muted">{clienteNome}</p>
          </div>
        </div>
        <Badge variant={relatorio.status === "FINALIZADO" ? "success" : "warning"}>
          {relatorio.status === "FINALIZADO" ? "Finalizado" : "Rascunho"}
        </Badge>
      </header>

      <main className="mx-auto max-w-lg space-y-4 p-4">
        {step === "itens" && relatorio.status !== "FINALIZADO" && (
          <>
            <Card className="bg-sky-50 border-sky-100">
              <p className="text-sm text-sky-900">
                Adicione os serviços realizados. As fotos antes/depois são{" "}
                <strong>opcionais</strong> — você pode finalizar o relatório sem
                elas. O cliente só é necessário na hora de finalizar.
              </p>
            </Card>

            <Card className="space-y-3">
              <h2 className="font-medium">Adicionar Serviço</h2>
              <div className="flex gap-2">
                <Select
                  value={selectedServico}
                  onChange={(e) => setSelectedServico(e.target.value)}
                  className="flex-1"
                >
                  <option value="">Tipo de serviço</option>
                  {servicos.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </Select>
                <Button onClick={addItem} disabled={!selectedServico}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            {relatorio.itens.length === 0 && (
              <Card className="text-center py-8 text-sm text-muted">
                Nenhum serviço adicionado ainda
              </Card>
            )}

            {relatorio.itens.map((item) => {
              const fotoAntes = item.fotos.find((f) => f.tipo === "ANTES");
              const fotoDepois = item.fotos.find((f) => f.tipo === "DEPOIS");

              return (
                <Card key={item.id} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium">{item.servico.nome}</h3>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => openCamera(item, "ANTES")}
                      className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-4 hover:border-primary transition-colors"
                    >
                      {fotoAntes ? (
                        <img
                          src={fotoAntes.url}
                          alt="Antes"
                          className="h-24 w-full rounded object-cover"
                        />
                      ) : (
                        <Camera className="h-8 w-8 text-muted" />
                      )}
                      <span className="text-xs font-medium text-muted">
                        ANTES (opcional) {fotoAntes && "✓"}
                      </span>
                    </button>

                    <button
                      onClick={() => openCamera(item, "DEPOIS")}
                      className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-4 hover:border-primary transition-colors"
                    >
                      {fotoDepois ? (
                        <img
                          src={fotoDepois.url}
                          alt="Depois"
                          className="h-24 w-full rounded object-cover"
                        />
                      ) : (
                        <Camera className="h-8 w-8 text-muted" />
                      )}
                      <span className="text-xs font-medium text-muted">
                        DEPOIS (opcional) {fotoDepois && "✓"}
                      </span>
                    </button>
                  </div>
                </Card>
              );
            })}

            <Button className="w-full" size="lg" onClick={() => setStep("finalizar")}>
              Continuar — Finalizar Relatório
            </Button>
          </>
        )}

        {step === "finalizar" && relatorio.status !== "FINALIZADO" && (
          <Card className="space-y-4">
            <h2 className="font-medium">Finalizar Relatório</h2>
            <p className="text-sm text-muted">
              Preencha o cliente contratante para gerar o PDF. Fotos e serviços
              são opcionais.
            </p>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Cliente contratante *
              </label>
              <ClienteSearchSelect
                clientes={clientes}
                value={clienteId}
                onChange={setClienteId}
                placeholder="Buscar cliente por nome, telefone..."
              />
              <button
                type="button"
                onClick={() => setShowNewCliente(!showNewCliente)}
                className="mt-2 flex items-center gap-1 text-sm text-primary"
              >
                <Plus className="h-4 w-4" />
                Cadastrar novo cliente
              </button>
            </div>

            {showNewCliente && (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <Input
                  placeholder="Nome / Razão social *"
                  value={newCliente.nome}
                  onChange={(e) =>
                    setNewCliente({ ...newCliente, nome: e.target.value })
                  }
                />
                <Input
                  placeholder="CPF/CNPJ"
                  value={newCliente.documento}
                  onChange={(e) =>
                    setNewCliente({ ...newCliente, documento: e.target.value })
                  }
                />
                <Input
                  placeholder="Telefone"
                  value={newCliente.telefone}
                  onChange={(e) =>
                    setNewCliente({ ...newCliente, telefone: e.target.value })
                  }
                />
                <Input
                  placeholder="Endereço"
                  value={newCliente.endereco}
                  onChange={(e) =>
                    setNewCliente({ ...newCliente, endereco: e.target.value })
                  }
                />
                <Button size="sm" onClick={criarCliente}>
                  Salvar Cliente
                </Button>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">
                Endereço do serviço
              </label>
              <Input
                value={enderecoServico}
                onChange={(e) => setEnderecoServico(e.target.value)}
                placeholder="Local onde o serviço foi realizado"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Observações</label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>

            <SignaturePad
              ref={assinaturaTecnicoRef}
              label="Assinatura do Técnico"
              onSave={setAssinaturaTecnico}
            />

            <SignaturePad
              ref={assinaturaClienteRef}
              label="Assinatura do Cliente (opcional)"
              onSave={setAssinaturaCliente}
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("itens")}>
                Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={finalizar}
                disabled={finalizando}
              >
                <Check className="h-4 w-4" />
                {finalizando ? "Gerando..." : "Finalizar e Gerar PDF"}
              </Button>
            </div>
          </Card>
        )}

        {(step === "concluido" || relatorio.status === "FINALIZADO") && (
          <Card className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold">Relatório Finalizado!</h2>
            {relatorio.cliente && (
              <p className="text-sm text-muted">{relatorio.cliente.nome}</p>
            )}

            <div className="flex flex-col gap-2">
              <a href={`/api/pdf/relatorio/${id}`} target="_blank">
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4" />
                  Baixar PDF
                </Button>
              </a>
              {relatorio.cliente?.telefone && (
                <Button className="w-full" onClick={shareWhatsApp}>
                  <MessageCircle className="h-4 w-4" />
                  Enviar por WhatsApp
                </Button>
              )}
              <Button variant="ghost" onClick={() => router.push("/campo")}>
                Voltar ao Início
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

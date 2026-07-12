"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { SignaturePad, type SignaturePadRef } from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, FileText, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AssinarInfo {
  tipo: "relatorio" | "orcamento";
  numero: number;
  clienteNome: string;
  empresaNome: string;
  responsavelNome: string;
  jaAssinado: boolean;
  expirado: boolean;
  total?: number;
  temAssinaturaTecnico: boolean;
}

export default function AssinarPage() {
  const params = useParams();
  const token = params.token as string;
  const assinaturaRef = useRef<SignaturePadRef>(null);

  const [info, setInfo] = useState<AssinarInfo | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);

  useEffect(() => {
    fetch(`/api/assinar/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Link inválido");
        setInfo(data);
        if (data.jaAssinado) setConcluido(true);
      })
      .catch((err) => setError(err.message || "Erro ao carregar"))
      .finally(() => setLoading(false));
  }, [token]);

  const assinar = async () => {
    setError("");
    const sig = assinaturaRef.current?.exportSignature();
    if (!sig) {
      setError("Desenhe sua assinatura antes de confirmar.");
      return;
    }

    setEnviando(true);
    const res = await fetch(`/api/assinar/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assinaturaCliente: sig }),
    });

    const data = await res.json();
    setEnviando(false);

    if (!res.ok) {
      setError(data.error || "Erro ao salvar assinatura");
      return;
    }

    setConcluido(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <p className="text-muted">Carregando...</p>
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md space-y-3 p-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!info) return null;

  const titulo =
    info.tipo === "relatorio"
      ? `Relatório de Serviço #${String(info.numero).padStart(4, "0")}`
      : `Orçamento #${String(info.numero).padStart(4, "0")}`;

  if (concluido || info.jaAssinado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 to-slate-100 p-4">
        <Card className="max-w-md space-y-4 p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold">Assinatura registrada!</h1>
          <p className="text-sm text-muted">
            {titulo} — {info.clienteNome}
          </p>
          <p className="text-sm text-muted">
            Obrigado. O prestador de serviço já pode gerar o documento final.
          </p>
        </Card>
      </div>
    );
  }

  if (info.expirado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md space-y-3 p-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="font-semibold">Link expirado</h1>
          <p className="text-sm text-muted">
            Solicite um novo link de assinatura ao prestador de serviço.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-slate-100 p-4">
      <div className="mx-auto max-w-lg space-y-4">
        <Card className="space-y-3 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold">{titulo}</h1>
              <p className="text-sm text-muted">{info.empresaNome}</p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p>
              <strong>Cliente:</strong> {info.clienteNome}
            </p>
            <p>
              <strong>Responsável:</strong> {info.responsavelNome}
            </p>
            {info.tipo === "orcamento" && info.total != null && (
              <p>
                <strong>Valor:</strong> {formatCurrency(info.total)}
              </p>
            )}
            {info.tipo === "relatorio" && info.temAssinaturaTecnico && (
              <p className="mt-1 text-xs text-green-700">
                ✓ Técnico já assinou este documento
              </p>
            )}
          </div>

          <p className="text-sm text-muted">
            {info.tipo === "relatorio"
              ? "Confirme o relatório de serviço assinando abaixo."
              : "Confirme o orçamento assinando abaixo."}
          </p>
        </Card>

        <Card className="p-5">
          <SignaturePad
            ref={assinaturaRef}
            label="Sua assinatura"
            onSave={() => {}}
          />

          {error && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <Button className="mt-4 w-full" onClick={assinar} disabled={enviando}>
            {enviando ? "Salvando..." : "Confirmar assinatura"}
          </Button>
        </Card>
      </div>
    </div>
  );
}

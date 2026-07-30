"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import { Card } from "@/components/ui/card";
import { Trash2, Loader2 } from "lucide-react";
import { FotoPicker } from "@/components/relatorio/FotoPicker";
import { toAssetPath } from "@/lib/assetUrl";

export interface AnexoItem {
  id: string;
  url: string;
}

interface Props {
  relatorioId: string;
  anexos: AnexoItem[];
  onChanged: () => void;
  /** Se false, só visualiza (sem adicionar/remover) */
  editavel?: boolean;
}

export function RelatorioAnexosSection({
  relatorioId,
  anexos,
  onChanged,
  editavel = true,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const formData = new FormData();
      formData.append("file", compressed, "anexo.jpg");

      const res = await fetch(`/api/relatorios/${relatorioId}/anexos`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha no upload");
      }
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este anexo?")) return;
    await fetch(`/api/relatorios/anexos/${id}`, { method: "DELETE" });
    onChanged();
  };

  return (
    <Card className="space-y-3">
      <h2 className="font-semibold">Fotos anexadas</h2>
      <p className="text-xs text-muted">
        Fotos gerais do serviço (além de antes/depois).
      </p>

      {anexos.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma foto anexada</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {anexos.map((a) => (
            <div key={a.id} className="relative">
              <a href={toAssetPath(a.url)} target="_blank" rel="noopener noreferrer">
                <img
                  src={toAssetPath(a.url)}
                  alt="Anexo"
                  className="h-28 w-full rounded-lg border object-cover"
                />
              </a>
              {editavel && (
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="absolute right-1 top-1 rounded-full bg-white/90 p-1.5 text-red-600 shadow"
                  aria-label="Remover anexo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {editavel && (
        <>
          {uploading ? (
            <p className="inline-flex items-center gap-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </p>
          ) : (
            <FotoPicker
              onFile={upload}
              cameraLabel="Tirar foto"
              anexoLabel="Anexar do dispositivo"
            />
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </>
      )}
    </Card>
  );
}

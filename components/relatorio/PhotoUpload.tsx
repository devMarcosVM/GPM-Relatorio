"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import { Loader2 } from "lucide-react";
import { FotoPicker } from "@/components/relatorio/FotoPicker";
import type { OrientacaoFoto, TipoFoto } from "@/lib/types";

interface PhotoUploadProps {
  relatorioItemId: string;
  tipo: TipoFoto;
  orientacao: OrientacaoFoto;
  onComplete: () => void;
  label?: string;
  className?: string;
}

export function PhotoUpload({
  relatorioItemId,
  tipo,
  orientacao,
  onComplete,
  className = "",
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setUploading(true);
    setError("");

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const formData = new FormData();
      formData.append("file", compressed, "foto.jpg");
      formData.append("relatorioItemId", relatorioItemId);
      formData.append("tipo", tipo);
      formData.append("orientacao", orientacao);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Falha no upload");

      onComplete();
    } catch {
      setError("Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      {uploading ? (
        <p className="inline-flex items-center gap-1.5 text-xs text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Enviando...
        </p>
      ) : (
        <FotoPicker
          onFile={handleFile}
          size="sm"
          cameraLabel="Tirar"
          anexoLabel="Anexar"
        />
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

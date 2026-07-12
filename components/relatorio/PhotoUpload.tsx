"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { Camera, Loader2 } from "lucide-react";
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
  label = "Trocar foto",
  className = "",
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
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
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
        {uploading ? "Enviando..." : label}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

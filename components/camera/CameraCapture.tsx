"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, Smartphone } from "lucide-react";
import { FotoPicker } from "@/components/relatorio/FotoPicker";
import type { OrientacaoFoto, TipoFoto } from "@/lib/types";

interface CameraCaptureProps {
  orientacao: OrientacaoFoto;
  tipo: TipoFoto;
  servicoNome: string;
  relatorioItemId: string;
  onComplete: (url: string) => void;
  onCancel: () => void;
}

async function compressAndUpload(
  file: File | Blob,
  relatorioItemId: string,
  tipo: TipoFoto,
  orientacao: OrientacaoFoto
) {
  const compressed = await imageCompression(file as File, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });

  const formData = new FormData();
  formData.append("file", compressed, "foto.jpg");
  formData.append("relatorioItemId", relatorioItemId);
  formData.append("tipo", tipo);
  formData.append("orientacao", orientacao);

  const uploadRes = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!uploadRes.ok) throw new Error("Falha no upload");
  return uploadRes.json();
}

export function CameraCapture({
  orientacao,
  tipo,
  servicoNome,
  relatorioItemId,
  onComplete,
  onCancel,
}: CameraCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setPendingFile(file);
  };

  const retake = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPendingFile(null);
    setError(null);
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    setError(null);

    try {
      const foto = await compressAndUpload(
        pendingFile,
        relatorioItemId,
        tipo,
        orientacao
      );
      onComplete(foto.url);
    } catch {
      setError("Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const isVertical = orientacao === "VERTICAL";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between p-4 text-white">
        <button type="button" onClick={onCancel} className="text-sm">
          Cancelar
        </button>
        <div className="text-center">
          <p className="text-xs text-slate-300">{servicoNome}</p>
          <p className="font-semibold">
            Foto {tipo === "ANTES" ? "ANTES" : "DEPOIS"}
          </p>
        </div>
        <div className="w-16" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        {!preview && (
          <div className="flex flex-col items-center gap-6 text-white">
            <div
              className={`flex items-center justify-center rounded-2xl border-2 border-dashed border-sky-400 ${
                isVertical ? "h-64 w-40" : "h-40 w-64"
              }`}
            >
              <Smartphone
                className={`h-12 w-12 text-sky-400 ${isVertical ? "" : "rotate-90"}`}
              />
            </div>
            <p className="text-center text-sm text-slate-300">
              Segure o celular na posição{" "}
              <strong>{isVertical ? "vertical" : "horizontal"}</strong>
            </p>
            <p className="max-w-xs text-center text-xs text-slate-400">
              Tire a foto com a câmera ou anexe uma imagem do dispositivo.
              Se a câmera abrir na frontal, use o ícone de virar.
            </p>
            <FotoPicker
              onFile={handleFile}
              disabled={uploading}
              layout="stack"
              size="lg"
              tone="dark"
              cameraLabel="Tirar foto"
              anexoLabel="Anexar do dispositivo"
              className="w-full max-w-xs"
            />
          </div>
        )}

        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="max-h-[60vh] max-w-full rounded-lg object-contain"
          />
        )}
      </div>

      {error && (
        <div className="px-4 pb-2 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex justify-center gap-4 p-6">
        {preview && !uploading && (
          <>
            <Button
              variant="outline"
              onClick={retake}
              className="border-2 border-white bg-slate-900 text-white hover:bg-slate-800"
            >
              <RotateCcw className="h-4 w-4" />
              Refazer
            </Button>
            <Button onClick={confirmUpload}>
              <Check className="h-4 w-4" />
              Confirmar
            </Button>
          </>
        )}

        {uploading && <p className="text-sm text-white">Enviando foto...</p>}
      </div>
    </div>
  );
}

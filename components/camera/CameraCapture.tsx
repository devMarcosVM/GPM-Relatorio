"use client";

import { useRef, useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, Check, Smartphone } from "lucide-react";
import type { OrientacaoFoto, TipoFoto } from "@/lib/types";

interface CameraCaptureProps {
  orientacao: OrientacaoFoto;
  tipo: TipoFoto;
  servicoNome: string;
  relatorioItemId: string;
  onComplete: (url: string) => void;
  onCancel: () => void;
}

export function CameraCapture({
  orientacao,
  tipo,
  servicoNome,
  relatorioItemId,
  onComplete,
  onCancel,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      setStream(mediaStream);
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch {
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setCameraActive(false);
  }, [stream]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    setPreview(canvas.toDataURL("image/jpeg", 0.9));
    stopCamera();
  };

  const retake = () => {
    setPreview(null);
    startCamera();
  };

  const upload = async () => {
    if (!preview) return;
    setUploading(true);
    setError(null);

    try {
      const res = await fetch(preview);
      const blob = await res.blob();

      const compressed = await imageCompression(blob as File, {
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

      const foto = await uploadRes.json();
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
        <button onClick={onCancel} className="text-sm">
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
        {!cameraActive && !preview && (
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
            <Button onClick={startCamera} size="lg">
              <Camera className="h-5 w-5" />
              Abrir Câmera
            </Button>
          </div>
        )}

        {cameraActive && !preview && (
          <div className="relative w-full max-w-lg">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg"
            />
            <div
              className={`pointer-events-none absolute inset-4 rounded-lg border-2 border-white/50 ${
                isVertical ? "mx-auto max-w-[60%]" : "my-auto max-h-[60%]"
              }`}
            />
            <p className="mt-2 text-center text-xs text-white/70">
              {isVertical ? "Modo vertical" : "Modo horizontal"}
            </p>
          </div>
        )}

        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="max-h-[60vh] max-w-full rounded-lg object-contain"
          />
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {error && (
        <p className="px-4 pb-2 text-center text-sm text-red-400">{error}</p>
      )}

      <div className="flex justify-center gap-4 p-6">
        {cameraActive && !preview && (
          <button
            onClick={capture}
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20"
          >
            <div className="h-12 w-12 rounded-full bg-white" />
          </button>
        )}

        {preview && (
          <>
            <Button variant="outline" onClick={retake} disabled={uploading}>
              <RotateCcw className="h-4 w-4" />
              Refazer
            </Button>
            <Button onClick={upload} disabled={uploading}>
              <Check className="h-4 w-4" />
              {uploading ? "Enviando..." : "Confirmar"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

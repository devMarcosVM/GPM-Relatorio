"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, Maximize2, X } from "lucide-react";

export interface SignaturePadRef {
  exportSignature: () => string | null;
  isEmpty: () => boolean;
}

interface SignaturePadProps {
  onSave?: (dataUrl: string) => void;
  label?: string;
}

const INLINE_HEIGHT = 140;
const SIGNATURE_ASPECT_RATIO = 400 / INLINE_HEIGHT;

function isCanvasEmpty(canvas: HTMLCanvasElement | null): boolean {
  if (!canvas) return true;
  const ctx = canvas.getContext("2d");
  if (!ctx) return true;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return !imageData.data.some((channel, index) => {
    return index % 4 === 3 && channel !== 0;
  });
}

function configureStrokeContext(ctx: CanvasRenderingContext2D, lineWidth = 2) {
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function paintSnapshotOnCanvas(
  canvas: HTMLCanvasElement,
  dataUrl: string
): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve();
        return;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      configureStrokeContext(ctx);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = dataUrl;
  });
}

function waitForLayout() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  function SignaturePad({ onSave, label = "Assinatura" }, ref) {
    const inlineCanvasRef = useRef<HTMLCanvasElement>(null);
    const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null);
    const inlineContainerRef = useRef<HTMLDivElement>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement>(null);
    const signatureSnapshotRef = useRef<string | null>(null);
    const isDrawingRef = useRef(false);
    const [hasStroke, setHasStroke] = useState(false);
    const [saved, setSaved] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const setupCanvas = useCallback(
      (
        canvas: HTMLCanvasElement | null,
        container: HTMLDivElement | null,
        height: number
      ) => {
        if (!canvas || !container) return;

        const dpr = window.devicePixelRatio || 1;
        const displayWidth = container.clientWidth;
        const displayHeight = height;

        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        configureStrokeContext(ctx);
      },
      []
    );

    const updateSnapshotFromCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
      if (!canvas || isCanvasEmpty(canvas)) return;
      signatureSnapshotRef.current = canvas.toDataURL("image/png");
      setHasStroke(true);
    }, []);

    const restoreInlineFromSnapshot = useCallback(async () => {
      const canvas = inlineCanvasRef.current;
      const container = inlineContainerRef.current;
      if (!canvas || !container) return;

      setupCanvas(canvas, container, INLINE_HEIGHT);

      if (signatureSnapshotRef.current) {
        await paintSnapshotOnCanvas(canvas, signatureSnapshotRef.current);
        setHasStroke(true);
      }
    }, [setupCanvas]);

    const setupFullscreenCanvas = useCallback(async () => {
      const container = fullscreenContainerRef.current;
      const canvas = fullscreenCanvasRef.current;
      if (!container || !canvas) return;

      const height = container.clientWidth / SIGNATURE_ASPECT_RATIO;
      setupCanvas(canvas, container, height);

      if (signatureSnapshotRef.current) {
        await paintSnapshotOnCanvas(canvas, signatureSnapshotRef.current);
        setHasStroke(true);
      }
    }, [setupCanvas]);

    useEffect(() => {
      void restoreInlineFromSnapshot();
      const onResize = () => {
        void restoreInlineFromSnapshot();
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, [restoreInlineFromSnapshot]);

    useEffect(() => {
      if (!fullscreen) return;

      document.body.style.overflow = "hidden";

      const initFullscreen = () => {
        void setupFullscreenCanvas();
      };

      requestAnimationFrame(initFullscreen);

      const onResize = () => {
        const previous = fullscreenCanvasRef.current;
        if (!previous || isCanvasEmpty(previous)) {
          void setupFullscreenCanvas();
          return;
        }
        signatureSnapshotRef.current = previous.toDataURL("image/png");
        void setupFullscreenCanvas();
      };

      window.addEventListener("resize", onResize);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("resize", onResize);
      };
    }, [fullscreen, setupFullscreenCanvas]);

    useEffect(() => {
      if (fullscreen || !signatureSnapshotRef.current) return;
      void (async () => {
        await waitForLayout();
        await restoreInlineFromSnapshot();
      })();
    }, [fullscreen, restoreInlineFromSnapshot]);

    const exportSignature = useCallback((): string | null => {
      if (signatureSnapshotRef.current) return signatureSnapshotRef.current;
      const canvas = inlineCanvasRef.current;
      if (!canvas || isCanvasEmpty(canvas)) return null;
      return canvas.toDataURL("image/png");
    }, []);

    useImperativeHandle(ref, () => ({
      exportSignature,
      isEmpty: () => !signatureSnapshotRef.current && isCanvasEmpty(inlineCanvasRef.current),
    }));

    const getPos = useCallback(
      (canvas: HTMLCanvasElement, e: React.TouchEvent | React.MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        const dpr = window.devicePixelRatio || 1;
        return {
          x: ((clientX - rect.left) * canvas.width) / rect.width / dpr,
          y: ((clientY - rect.top) * canvas.height) / rect.height / dpr,
        };
      },
      []
    );

    const startDraw = useCallback(
      (canvas: HTMLCanvasElement, e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        isDrawingRef.current = true;
        setSaved(false);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const pos = getPos(canvas, e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      },
      [getPos]
    );

    const draw = useCallback(
      (canvas: HTMLCanvasElement, e: React.TouchEvent | React.MouseEvent) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const pos = getPos(canvas, e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        setHasStroke(true);
      },
      [getPos]
    );

    const stopDraw = useCallback(
      (canvas: HTMLCanvasElement | null) => {
        isDrawingRef.current = false;
        if (canvas) updateSnapshotFromCanvas(canvas);
      },
      [updateSnapshotFromCanvas]
    );

    const clearCanvas = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const clear = () => {
      signatureSnapshotRef.current = null;
      clearCanvas(inlineCanvasRef.current);
      clearCanvas(fullscreenCanvasRef.current);
      setHasStroke(false);
      setSaved(false);
    };

    const captureFullscreenSignature = () => {
      const full = fullscreenCanvasRef.current;
      if (!full || isCanvasEmpty(full)) return false;
      signatureSnapshotRef.current = full.toDataURL("image/png");
      setHasStroke(true);
      return true;
    };

    const openFullscreen = () => {
      updateSnapshotFromCanvas(inlineCanvasRef.current);
      setFullscreen(true);
    };

    const tryLockLandscape = async () => {
      try {
        await document.documentElement.requestFullscreen?.();
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (orientation: "landscape") => Promise<void>;
        };
        await orientation.lock?.("landscape");
      } catch {
        // Alguns navegadores móveis não permitem travar a orientação.
      }
    };

    const unlockLandscape = async () => {
      try {
        screen.orientation?.unlock?.();
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch {
        // Ignora quando o navegador não suporta sair/destravar por script.
      }
    };

    const closeFullscreen = async () => {
      captureFullscreenSignature();
      setFullscreen(false);
      isDrawingRef.current = false;
      await unlockLandscape();
      await waitForLayout();
      await restoreInlineFromSnapshot();
    };

    const save = async () => {
      if (fullscreen) {
        captureFullscreenSignature();
        setFullscreen(false);
        await unlockLandscape();
        await waitForLayout();
        await restoreInlineFromSnapshot();
      }

      const dataUrl = exportSignature();
      if (!dataUrl) return;
      onSave?.(dataUrl);
      setSaved(true);
    };

    const canvasHandlers = (getCanvas: () => HTMLCanvasElement | null) => ({
      onMouseDown: (e: React.MouseEvent) => {
        const canvas = getCanvas();
        if (canvas) startDraw(canvas, e);
      },
      onMouseMove: (e: React.MouseEvent) => {
        const canvas = getCanvas();
        if (canvas) draw(canvas, e);
      },
      onMouseUp: () => stopDraw(getCanvas()),
      onMouseLeave: () => stopDraw(getCanvas()),
      onTouchStart: (e: React.TouchEvent) => {
        const canvas = getCanvas();
        if (canvas) startDraw(canvas, e);
      },
      onTouchMove: (e: React.TouchEvent) => {
        const canvas = getCanvas();
        if (canvas) draw(canvas, e);
      },
      onTouchEnd: () => stopDraw(getCanvas()),
    });

    const inlineHandlers = canvasHandlers(() => inlineCanvasRef.current);
    const fullscreenHandlers = canvasHandlers(() => fullscreenCanvasRef.current);

    const fullscreenOverlay =
      fullscreen && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[200] flex flex-col bg-white">
              <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
                <p className="text-base font-semibold">{label}</p>
                <button
                  type="button"
                  onClick={() => void closeFullscreen()}
                  className="rounded-lg p-2 text-muted hover:bg-slate-100"
                  aria-label="Fechar tela cheia"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-slate-50 px-3 py-4">
                <p className="text-center text-sm font-medium text-slate-700">
                  Vire o celular na horizontal para desenhar com mais espaço.
                </p>
                <div
                  ref={fullscreenContainerRef}
                  className="w-full max-w-5xl"
                  style={{ aspectRatio: `${SIGNATURE_ASPECT_RATIO}` }}
                >
                  <canvas
                    ref={fullscreenCanvasRef}
                    className="h-full w-full touch-none rounded-lg border border-border bg-white"
                    {...fullscreenHandlers}
                  />
                </div>
              </div>

              <div className="flex shrink-0 gap-2 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Button type="button" variant="outline" className="flex-1" onClick={clear}>
                  <RotateCcw className="h-4 w-4" />
                  Limpar
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => void closeFullscreen()}
                  disabled={!hasStroke}
                >
                  <Check className="h-4 w-4" />
                  Usar assinatura
                </Button>
              </div>
            </div>,
            document.body
          )
        : null;

    return (
      <>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-700">{label}</p>
            <div className="flex items-center gap-2">
              {saved && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                  <Check className="h-3.5 w-3.5" />
                  Assinatura salva
                </span>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  openFullscreen();
                  void tryLockLandscape();
                }}
                title="Desenhar em tela cheia"
              >
                <Maximize2 className="h-4 w-4" />
                Tela cheia
              </Button>
            </div>
          </div>
          <div ref={inlineContainerRef} className="w-full">
            <canvas
              ref={inlineCanvasRef}
              className="w-full rounded-lg border border-border bg-white touch-none"
              {...inlineHandlers}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={clear}>
              <RotateCcw className="h-4 w-4" />
              Limpar
            </Button>
            <Button type="button" size="sm" onClick={() => void save()} disabled={!hasStroke}>
              Confirmar
            </Button>
          </div>
        </div>
        {fullscreenOverlay}
      </>
    );
  }
);

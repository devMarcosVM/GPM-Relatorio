"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check } from "lucide-react";

export interface SignaturePadRef {
  exportSignature: () => string | null;
  isEmpty: () => boolean;
}

interface SignaturePadProps {
  onSave?: (dataUrl: string) => void;
  label?: string;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 140;

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  function SignaturePad({ onSave, label = "Assinatura" }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasStroke, setHasStroke] = useState(false);
    const [saved, setSaved] = useState(false);

    const setupCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const displayWidth = container.clientWidth;
      const displayHeight = CANVAS_HEIGHT;

      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }, []);

    useEffect(() => {
      setupCanvas();
      window.addEventListener("resize", setupCanvas);
      return () => window.removeEventListener("resize", setupCanvas);
    }, [setupCanvas]);

    const isCanvasEmpty = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return true;
      const ctx = canvas.getContext("2d");
      if (!ctx) return true;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return !imageData.data.some((channel, index) => {
        return index % 4 === 3 && channel !== 0;
      });
    }, []);

    const exportSignature = useCallback((): string | null => {
      const canvas = canvasRef.current;
      if (!canvas || isCanvasEmpty()) return null;
      return canvas.toDataURL("image/png");
    }, [isCanvasEmpty]);

    useImperativeHandle(ref, () => ({
      exportSignature,
      isEmpty: isCanvasEmpty,
    }));

    const getPos = useCallback(
      (e: React.TouchEvent | React.MouseEvent) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        return {
          x: (clientX - rect.left) * (canvas.width / rect.width / (window.devicePixelRatio || 1)),
          y: (clientY - rect.top) * (canvas.height / rect.height / (window.devicePixelRatio || 1)),
        };
      },
      []
    );

    const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      setIsDrawing(true);
      setSaved(false);
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setHasStroke(true);
    };

    const stopDraw = () => setIsDrawing(false);

    const clear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasStroke(false);
      setSaved(false);
    };

    const save = () => {
      const dataUrl = exportSignature();
      if (!dataUrl) return;
      onSave?.(dataUrl);
      setSaved(true);
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-700">{label}</p>
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
              <Check className="h-3.5 w-3.5" />
              Assinatura salva
            </span>
          )}
        </div>
        <div ref={containerRef} className="w-full">
          <canvas
            ref={canvasRef}
            className="w-full rounded-lg border border-border bg-white touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={clear}>
            <RotateCcw className="h-4 w-4" />
            Limpar
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={!hasStroke}>
            Confirmar
          </Button>
        </div>
      </div>
    );
  }
);

"use client";

import { useRef } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FotoPickerProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  className?: string;
  cameraLabel?: string;
  anexoLabel?: string;
  size?: "sm" | "md" | "lg";
  layout?: "row" | "stack";
  /** Em fundos escuros (ex.: tela de câmera), deixa o botão de anexar legível */
  tone?: "light" | "dark";
}

export function FotoPicker({
  onFile,
  disabled,
  className,
  cameraLabel = "Tirar foto",
  anexoLabel = "Anexar do dispositivo",
  size = "md",
  layout = "row",
  tone = "light",
}: FotoPickerProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = "";
  };

  return (
    <div
      className={cn(
        layout === "stack" ? "flex flex-col gap-2" : "flex flex-wrap gap-2",
        className
      )}
    >
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        size={size}
        disabled={disabled}
        onClick={() => cameraRef.current?.click()}
        className={layout === "stack" ? "w-full" : undefined}
      >
        <Camera className="h-4 w-4" />
        {cameraLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={disabled}
        onClick={() => fileRef.current?.click()}
        className={cn(
          layout === "stack" ? "w-full" : undefined,
          tone === "dark"
            ? "border-2 border-sky-300 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
            : "text-slate-900"
        )}
      >
        <ImagePlus className="h-4 w-4" />
        {anexoLabel}
      </Button>
    </div>
  );
}

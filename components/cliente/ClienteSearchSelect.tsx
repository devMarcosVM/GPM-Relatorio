"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClienteOption {
  id: string;
  nome: string;
  documento?: string | null;
  telefone?: string | null;
  endereco?: string | null;
}

interface ClienteSearchSelectProps {
  clientes: ClienteOption[];
  value: string;
  onChange: (clienteId: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchesCliente(cliente: ClienteOption, query: string) {
  const q = normalize(query);
  if (!q) return true;
  return [cliente.nome, cliente.documento, cliente.telefone, cliente.endereco].some(
    (field) => field?.toLowerCase().includes(q)
  );
}

export function ClienteSearchSelect({
  clientes,
  value,
  onChange,
  placeholder = "Digite para buscar cliente...",
  allowEmpty = false,
  emptyLabel = "Sem cliente",
  className,
}: ClienteSearchSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = clientes.find((c) => c.id === value) ?? null;

  useEffect(() => {
    if (!open && selected) {
      setQuery(selected.nome);
    }
    if (!value && !open) {
      setQuery("");
    }
  }, [value, selected, open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        if (selected) setQuery(selected.nome);
        else setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected]);

  const filtered = useMemo(() => {
    const list = clientes.filter((c) => matchesCliente(c, query));
    return list.slice(0, 50);
  }, [clientes, query]);

  const selectCliente = (cliente: ClienteOption | null) => {
    if (cliente) {
      onChange(cliente.id);
      setQuery(cliente.nome);
    } else {
      onChange("");
      setQuery("");
    }
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (selected && e.target.value !== selected.nome) {
              onChange("");
            }
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pl-9 pr-16"
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={() => selectCliente(null)}
              className="rounded p-1 text-muted hover:bg-slate-100 hover:text-slate-700"
              aria-label="Limpar cliente"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted transition-transform",
              open && "rotate-180"
            )}
          />
        </div>
      </div>

      {selected && !open && (
        <p className="mt-1.5 text-xs text-muted">
          {[selected.documento, selected.telefone].filter(Boolean).join(" • ")}
        </p>
      )}

      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
          {allowEmpty && (
            <button
              type="button"
              onClick={() => selectCliente(null)}
              className={cn(
                "flex w-full items-center gap-2 border-b border-border px-3 py-2.5 text-left text-sm hover:bg-slate-50",
                !value && "bg-sky-50"
              )}
            >
              {!value && <Check className="h-4 w-4 shrink-0 text-primary" />}
              <span className={!value ? "font-medium" : "text-muted"}>
                {emptyLabel}
              </span>
            </button>
          )}

          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted">
              Nenhum cliente encontrado
            </p>
          ) : (
            filtered.map((cliente) => {
              const isSelected = cliente.id === value;
              return (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => selectCliente(cliente)}
                  className={cn(
                    "flex w-full items-start gap-2 border-b border-border px-3 py-2.5 text-left last:border-b-0 hover:bg-slate-50",
                    isSelected && "bg-sky-50"
                  )}
                >
                  {isSelected ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <span className="w-4 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm truncate",
                        isSelected && "font-medium text-primary"
                      )}
                    >
                      {cliente.nome}
                    </p>
                    {(cliente.documento || cliente.telefone) && (
                      <p className="text-xs text-muted truncate">
                        {[cliente.documento, cliente.telefone]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}

          {clientes.length > 50 && filtered.length === 50 && (
            <p className="border-t border-border px-3 py-2 text-center text-xs text-muted">
              Mostrando 50 resultados — refine a busca
            </p>
          )}
        </div>
      )}
    </div>
  );
}

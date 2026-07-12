"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { isEmpresaConfigured } from "@/lib/empresa";

export function EmpresaSetupBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch("/api/empresa")
      .then((r) => r.json())
      .then((data) => {
        if (!data?.error && !isEmpresaConfigured(data)) {
          setShow(true);
        }
      });
  }, []);

  if (!show) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-medium text-amber-900">
              Dados da empresa ainda não configurados
            </p>
            <p className="text-sm text-amber-800">
              Cadastre razão social, CNPJ e contatos para gerar relatórios e orçamentos.
            </p>
          </div>
        </div>
        <Link
          href="/admin/configuracoes"
          className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 text-center"
        >
          Configurar agora
        </Link>
      </div>
    </div>
  );
}

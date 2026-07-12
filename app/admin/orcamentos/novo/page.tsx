"use client";

import {
  OrcamentoForm,
  OrcamentoFormHeader,
} from "@/components/orcamento/OrcamentoForm";

export default function AdminNovoOrcamentoPage() {
  return (
    <div>
      <OrcamentoFormHeader backHref="/admin/orcamentos" />
      <OrcamentoForm backHref="/admin/orcamentos" backLabel="Voltar aos Orçamentos" />
    </div>
  );
}

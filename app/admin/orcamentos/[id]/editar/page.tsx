"use client";

import { useParams } from "next/navigation";
import {
  OrcamentoForm,
  OrcamentoFormHeader,
} from "@/components/orcamento/OrcamentoForm";

export default function AdminEditarOrcamentoPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <OrcamentoFormHeader
        backHref="/admin/orcamentos"
        title="Continuar orçamento"
      />
      <OrcamentoForm
        orcamentoId={id}
        backHref="/admin/orcamentos"
        backLabel="Voltar aos Orçamentos"
      />
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getAbsoluteUrl } from "@/lib/storage";
import { isEmpresaConfigured } from "@/lib/empresa";
import { RelatorioPDF } from "@/components/pdf/RelatorioPDF";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const [relatorio, empresa] = await Promise.all([
    prisma.relatorio.findUnique({
      where: { id },
      include: {
        cliente: true,
        tecnico: { select: { nome: true } },
        itens: {
          include: { servico: true, fotos: true },
          orderBy: { ordem: "asc" },
        },
      },
    }),
    prisma.empresa.findFirst(),
  ]);

  if (!relatorio) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  if (!empresa || !isEmpresaConfigured(empresa)) {
    return NextResponse.json(
      { error: "Configure os dados da empresa em Admin → Configurações" },
      { status: 400 }
    );
  }

  if (!relatorio.cliente) {
    return NextResponse.json(
      { error: "Relatório sem cliente — finalize o relatório primeiro" },
      { status: 400 }
    );
  }

  const buffer = await renderToBuffer(
    RelatorioPDF({
      empresa,
      relatorio: {
        ...relatorio,
        cliente: relatorio.cliente,
        dataInicio: relatorio.dataInicio.toISOString(),
        dataFim: relatorio.dataFim?.toISOString() ?? null,
      },
      absoluteUrl: getAbsoluteUrl,
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio-${String(relatorio.numero).padStart(4, "0")}.pdf"`,
    },
  });
}

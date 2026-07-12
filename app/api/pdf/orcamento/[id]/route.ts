import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getAbsoluteUrl } from "@/lib/assetUrl";
import { isEmpresaConfigured } from "@/lib/empresa";
import { OrcamentoPDF } from "@/components/pdf/OrcamentoPDF";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const [orcamento, empresa] = await Promise.all([
    prisma.orcamento.findUnique({
      where: { id },
      include: {
        cliente: true,
        itens: { include: { servico: true } },
      },
    }),
    prisma.empresa.findFirst(),
  ]);

  if (!orcamento) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  if (!empresa || !isEmpresaConfigured(empresa)) {
    return NextResponse.json(
      { error: "Configure os dados da empresa em Admin → Configurações" },
      { status: 400 }
    );
  }

  const buffer = await renderToBuffer(
    OrcamentoPDF({
      empresa,
      orcamento: {
        ...orcamento,
        createdAt: orcamento.createdAt.toISOString(),
      },
      absoluteUrl: getAbsoluteUrl,
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="orcamento-${String(orcamento.numero).padStart(4, "0")}.pdf"`,
    },
  });
}

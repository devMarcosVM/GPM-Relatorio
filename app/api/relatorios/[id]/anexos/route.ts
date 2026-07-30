import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  loadRelatorioAccess,
  relatorioAcessoNegado,
} from "@/lib/relatorioAccess";
import { uploadPhoto } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const access = await loadRelatorioAccess(id);
  if (!access) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  if (relatorioAcessoNegado(session, access)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const anexos = await prisma.relatorioAnexo.findMany({
    where: { relatorioId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(anexos);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const access = await loadRelatorioAccess(id);
  if (!access) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  if (relatorioAcessoNegado(session, access)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadPhoto(buffer, file.name || "anexo.jpg", file.type);

  const anexo = await prisma.relatorioAnexo.create({
    data: {
      relatorioId: id,
      url,
    },
  });

  return NextResponse.json(anexo, { status: 201 });
}

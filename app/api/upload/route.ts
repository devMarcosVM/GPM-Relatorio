import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { uploadPhoto } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const relatorioItemId = formData.get("relatorioItemId") as string;
  const tipo = formData.get("tipo") as string;
  const orientacao = formData.get("orientacao") as string;

  if (!file || !relatorioItemId || !tipo) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadPhoto(buffer, file.name || "foto.jpg", file.type);

  const existing = await prisma.foto.findFirst({
    where: { relatorioItemId, tipo },
  });

  if (existing) {
    await prisma.foto.delete({ where: { id: existing.id } });
  }

  const foto = await prisma.foto.create({
    data: {
      relatorioItemId,
      tipo,
      url,
      orientacao: orientacao || "VERTICAL",
    },
  });

  return NextResponse.json(foto, { status: 201 });
}

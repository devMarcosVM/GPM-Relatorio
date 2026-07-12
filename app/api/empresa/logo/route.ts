import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { uploadPhoto } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Envie uma imagem (PNG, JPG ou WebP)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadPhoto(
      buffer,
      `logo-${Date.now()}.${file.name.split(".").pop() || "jpg"}`,
      file.type
    );

    const existing = await prisma.empresa.findFirst();

    if (!existing) {
      return NextResponse.json(
        { error: "Salve os dados da empresa antes de enviar o logo" },
        { status: 400 }
      );
    }

    const empresa = await prisma.empresa.update({
      where: { id: existing.id },
      data: { logoUrl: url },
    });

    return NextResponse.json({ logoUrl: url, empresa });
  } catch {
    return NextResponse.json({ error: "Erro ao enviar logo" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await requireAdmin();

    const existing = await prisma.empresa.findFirst();
    if (!existing) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const empresa = await prisma.empresa.update({
      where: { id: existing.id },
      data: { logoUrl: null },
    });

    return NextResponse.json(empresa);
  } catch {
    return NextResponse.json({ error: "Erro ao remover logo" }, { status: 500 });
  }
}

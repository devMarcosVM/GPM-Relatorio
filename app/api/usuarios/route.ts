import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { Role } from "@/lib/types";

export async function GET() {
  try {
    await requireAdmin();

    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { relatorios: true, orcamentos: true },
        },
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json(usuarios);
  } catch {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const data = await request.json();

    const { nome, email, password, role } = data;

    if (!nome?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Nome, e-mail e senha são obrigatórios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    const userRole: Role = role === "ADMIN" ? "ADMIN" : "TECNICO";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Este e-mail já está em uso" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        password: hashed,
        role: userRole,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 });
  }
}

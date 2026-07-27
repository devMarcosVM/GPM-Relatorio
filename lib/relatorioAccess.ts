import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

export type RelatorioAccessRow = {
  id: string;
  status: string;
  tecnicoId: string;
};

export async function loadRelatorioAccess(
  id: string
): Promise<RelatorioAccessRow | null> {
  return prisma.relatorio.findUnique({
    where: { id },
    select: { id: true, status: true, tecnicoId: true },
  });
}

export function relatorioAcessoNegado(
  session: SessionUser,
  relatorio: RelatorioAccessRow
): boolean {
  return session.role === "TECNICO" && relatorio.tecnicoId !== session.id;
}

export function relatorioFinalizado(relatorio: { status: string }): boolean {
  return relatorio.status === "FINALIZADO";
}

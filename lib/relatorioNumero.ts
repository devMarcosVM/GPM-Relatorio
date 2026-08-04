import { prisma } from "@/lib/db";

export async function getNextNumeroRelatorio() {
  const last = await prisma.relatorio.findFirst({
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  return (last?.numero ?? 0) + 1;
}

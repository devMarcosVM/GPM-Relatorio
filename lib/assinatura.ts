import { prisma } from "./db";
import { isTokenExpirado } from "./assinaturaLink";
import { calcOrcamentoTotal } from "./orcamento";

export type DocumentoAssinatura =
  | {
      tipo: "relatorio";
      id: string;
      numero: number;
      assinaturaCliente: string | null;
      assinaturaTecnico: string | null;
      tokenAssinaturaExpira: Date | null;
      cliente: { nome: string; documento: string | null };
      tecnico: { nome: string };
      empresa: { razaoSocial: string } | null;
    }
  | {
      tipo: "orcamento";
      id: string;
      numero: number;
      assinaturaCliente: string | null;
      tokenAssinaturaExpira: Date | null;
      cliente: { nome: string; documento: string | null };
      criadoPor: { nome: string };
      empresa: { razaoSocial: string } | null;
      total: number;
    };

export async function buscarDocumentoPorToken(
  token: string
): Promise<DocumentoAssinatura | null> {
  const empresa = await prisma.empresa.findFirst({
    select: { razaoSocial: true },
  });

  const relatorio = await prisma.relatorio.findUnique({
    where: { tokenAssinatura: token },
    include: {
      cliente: { select: { nome: true, documento: true } },
      tecnico: { select: { nome: true } },
    },
  });

  if (relatorio?.cliente) {
    return {
      tipo: "relatorio",
      id: relatorio.id,
      numero: relatorio.numero,
      assinaturaCliente: relatorio.assinaturaCliente,
      assinaturaTecnico: relatorio.assinaturaTecnico,
      tokenAssinaturaExpira: relatorio.tokenAssinaturaExpira,
      cliente: relatorio.cliente,
      tecnico: relatorio.tecnico,
      empresa,
    };
  }

  const orcamento = await prisma.orcamento.findUnique({
    where: { tokenAssinatura: token },
    include: {
      cliente: { select: { nome: true, documento: true } },
      criadoPor: { select: { nome: true } },
      itens: true,
    },
  });

  if (orcamento) {
    const total = calcOrcamentoTotal(
      orcamento.itens,
      orcamento.desconto,
      orcamento.valorFinal
    );

    return {
      tipo: "orcamento",
      id: orcamento.id,
      numero: orcamento.numero,
      assinaturaCliente: orcamento.assinaturaCliente,
      tokenAssinaturaExpira: orcamento.tokenAssinaturaExpira,
      cliente: orcamento.cliente,
      criadoPor: orcamento.criadoPor,
      empresa,
      total,
    };
  }

  return null;
}

export function validarTokenAssinatura(doc: DocumentoAssinatura): string | null {
  if (doc.assinaturaCliente) {
    return "Este documento já foi assinado pelo cliente.";
  }
  if (isTokenExpirado(doc.tokenAssinaturaExpira)) {
    return "Este link expirou. Solicite um novo link ao prestador de serviço.";
  }
  return null;
}

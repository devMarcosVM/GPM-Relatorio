import { prisma } from "./db";
import { isTokenExpirado } from "./assinaturaLink";
import {
  calcDescontoPacote,
  calcOrcamentoSubtotal,
  calcOrcamentoTotal,
} from "./orcamento";

export interface DocumentoAssinaturaPublico {
  tipo: "relatorio" | "orcamento";
  id: string;
  numero: number;
  jaAssinado: boolean;
  expirado: boolean;
  empresa: {
    razaoSocial: string;
    cnpj: string;
    endereco: string;
    telefone: string;
    email: string;
  };
  cliente: {
    nome: string;
    documento: string | null;
    telefone: string | null;
    endereco: string | null;
  };
  responsavelNome: string;
  temAssinaturaTecnico: boolean;
  relatorio?: {
    enderecoServico: string | null;
    dataInicio: string;
    dataFim: string | null;
    observacoes: string | null;
    itens: Array<{
      servicoNome: string;
      servicoDescricao: string | null;
      observacoes: string | null;
      fotos: Array<{ tipo: string; url: string }>;
    }>;
  };
  orcamento?: {
    createdAt: string;
    validadeDias: number;
    formaPagamento: string | null;
    observacoes: string | null;
    desconto: number;
    subtotal: number;
    descontoPacote: number | null;
    total: number;
    itens: Array<{
      servicoNome: string;
      servicoDescricao: string | null;
      quantidade: number;
      precoUnitario: number;
      subtotal: number;
    }>;
  };
}

export async function buscarDocumentoPublicoPorToken(
  token: string
): Promise<DocumentoAssinaturaPublico | null> {
  const empresaDb = await prisma.empresa.findFirst();
  const empresa = {
    razaoSocial: empresaDb?.razaoSocial || "Prestador de Serviço",
    cnpj: empresaDb?.cnpj || "",
    endereco: empresaDb?.endereco || "",
    telefone: empresaDb?.telefone || "",
    email: empresaDb?.email || "",
  };

  const relatorio = await prisma.relatorio.findUnique({
    where: { tokenAssinatura: token },
    include: {
      cliente: true,
      tecnico: { select: { nome: true } },
      itens: {
        orderBy: { ordem: "asc" },
        include: {
          servico: { select: { nome: true, descricao: true } },
          fotos: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (relatorio?.cliente) {
    return {
      tipo: "relatorio",
      id: relatorio.id,
      numero: relatorio.numero,
      jaAssinado: !!relatorio.assinaturaCliente,
      expirado: isTokenExpirado(relatorio.tokenAssinaturaExpira) && !relatorio.assinaturaCliente,
      empresa,
      cliente: {
        nome: relatorio.cliente.nome,
        documento: relatorio.cliente.documento,
        telefone: relatorio.cliente.telefone,
        endereco: relatorio.cliente.endereco,
      },
      responsavelNome: relatorio.tecnico.nome,
      temAssinaturaTecnico: !!relatorio.assinaturaTecnico,
      relatorio: {
        enderecoServico: relatorio.enderecoServico,
        dataInicio: relatorio.dataInicio.toISOString(),
        dataFim: relatorio.dataFim?.toISOString() || null,
        observacoes: relatorio.observacoes,
        itens: relatorio.itens.map((item) => ({
          servicoNome: item.servico.nome,
          servicoDescricao: item.servico.descricao,
          observacoes: item.observacoes,
          fotos: item.fotos.map((f) => ({ tipo: f.tipo, url: f.url })),
        })),
      },
    };
  }

  const orcamento = await prisma.orcamento.findUnique({
    where: { tokenAssinatura: token },
    include: {
      cliente: true,
      criadoPor: { select: { nome: true } },
      itens: {
        include: {
          servico: { select: { nome: true, descricao: true } },
        },
      },
    },
  });

  if (!orcamento) return null;

  const subtotal = calcOrcamentoSubtotal(orcamento.itens);
  const total = calcOrcamentoTotal(
    orcamento.itens,
    orcamento.desconto,
    orcamento.valorFinal
  );
  const usaPacote =
    orcamento.valorFinal != null && orcamento.valorFinal >= 0;

  return {
    tipo: "orcamento",
    id: orcamento.id,
    numero: orcamento.numero,
    jaAssinado: !!orcamento.assinaturaCliente,
    expirado: isTokenExpirado(orcamento.tokenAssinaturaExpira) && !orcamento.assinaturaCliente,
    empresa,
    cliente: {
      nome: orcamento.cliente.nome,
      documento: orcamento.cliente.documento,
      telefone: orcamento.cliente.telefone,
      endereco: orcamento.cliente.endereco,
    },
    responsavelNome: orcamento.criadoPor.nome,
    temAssinaturaTecnico: false,
    orcamento: {
      createdAt: orcamento.createdAt.toISOString(),
      validadeDias: orcamento.validadeDias,
      formaPagamento: orcamento.formaPagamento,
      observacoes: orcamento.observacoes,
      desconto: orcamento.desconto,
      subtotal,
      descontoPacote: usaPacote
        ? calcDescontoPacote(subtotal, orcamento.valorFinal!)
        : null,
      total,
      itens: orcamento.itens.map((item) => ({
        servicoNome: item.servico.nome,
        servicoDescricao: item.servico.descricao,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        subtotal: item.quantidade * item.precoUnitario,
      })),
    },
  };
}

export function erroAssinatura(doc: DocumentoAssinaturaPublico): string | null {
  if (doc.jaAssinado) {
    return "Este documento já foi assinado pelo cliente.";
  }
  if (doc.expirado) {
    return "Este link expirou. Solicite um novo link ao prestador de serviço.";
  }
  return null;
}

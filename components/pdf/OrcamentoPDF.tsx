import { Document, Page, Text, View } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calcOrcamentoSubtotal, calcOrcamentoTotal, calcDescontoPacote } from "@/lib/orcamento";
import { pdfStyles } from "./pdfTheme";
import {
  PdfHeader,
  PdfPartiesRow,
  PdfSectionBanner,
  PdfAcceptanceFooter,
  PdfSignatureFooter,
} from "./PdfParts";

interface OrcamentoPDFProps {
  empresa: {
    razaoSocial: string;
    cnpj: string;
    endereco: string;
    telefone: string;
    email: string;
    logoUrl?: string | null;
  };
  orcamento: {
    numero: number;
    createdAt: string;
    validadeDias: number;
    desconto: number;
    valorFinal?: number | null;
    formaPagamento?: string | null;
    observacoes?: string | null;
    assinaturaCliente?: string | null;
    cliente: {
      nome: string;
      documento?: string | null;
      telefone?: string | null;
      endereco?: string | null;
    };
    itens: Array<{
      servico: { nome: string };
      quantidade: number;
      precoUnitario: number;
    }>;
  };
  absoluteUrl: (path: string) => string;
}

export function OrcamentoPDF({ empresa, orcamento, absoluteUrl }: OrcamentoPDFProps) {
  const subtotal = calcOrcamentoSubtotal(orcamento.itens);
  const descontoValor = subtotal * (orcamento.desconto / 100);
  const total = calcOrcamentoTotal(
    orcamento.itens,
    orcamento.desconto,
    orcamento.valorFinal
  );
  const usaPacote =
    orcamento.valorFinal != null && orcamento.valorFinal >= 0;
  const descontoPacote = usaPacote
    ? calcDescontoPacote(subtotal, orcamento.valorFinal!)
    : 0;

  const validade = new Date(orcamento.createdAt);
  validade.setDate(validade.getDate() + orcamento.validadeDias);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          empresa={empresa}
          title="ORÇAMENTO"
          subtitle={`Nº ${String(orcamento.numero).padStart(4, "0")}`}
          absoluteUrl={absoluteUrl}
        />

        <PdfPartiesRow
          contratada={{
            title: "CONTRATADA:",
            nome: empresa.razaoSocial,
            documento: empresa.cnpj,
            endereco: empresa.endereco,
            telefone: `${empresa.telefone} | ${empresa.email}`,
          }}
          contratante={{
            title: "CLIENTE:",
            nome: orcamento.cliente.nome,
            documento: orcamento.cliente.documento,
            endereco: orcamento.cliente.endereco,
            telefone: orcamento.cliente.telefone,
          }}
        />

        <View style={pdfStyles.metaRow}>
          <View style={pdfStyles.metaItem}>
            <Text style={pdfStyles.metaLabel}>Data:</Text>
            <Text style={pdfStyles.metaValue}>
              {formatDate(orcamento.createdAt)}
            </Text>
          </View>
          <View style={pdfStyles.metaItem}>
            <Text style={pdfStyles.metaLabel}>Validade:</Text>
            <Text style={pdfStyles.metaValue}>{formatDate(validade)}</Text>
          </View>
        </View>

        <PdfSectionBanner title="ITENS DO ORÇAMENTO" />

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderCell, { flex: 3 }]}>Serviço</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colQty]}>Qtd</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colUnit]}>
              Unit.
            </Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colTotal]}>
              Total
            </Text>
          </View>
          {orcamento.itens.map((item, idx) => (
            <View key={idx} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { flex: 3 }]}>
                {item.servico.nome}
              </Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.colQty]}>
                {item.quantidade}
              </Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.colUnit]}>
                {formatCurrency(item.precoUnitario)}
              </Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.colTotal]}>
                {formatCurrency(item.quantidade * item.precoUnitario)}
              </Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.totalsBox}>
          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>Subtotal:</Text>
            <Text style={pdfStyles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          {usaPacote ? (
            descontoPacote > 0 && (
              <View style={pdfStyles.totalRow}>
                <Text style={pdfStyles.totalLabel}>Desconto:</Text>
                <Text style={pdfStyles.totalValue}>
                  -{formatCurrency(descontoPacote)}
                </Text>
              </View>
            )
          ) : (
            orcamento.desconto > 0 && (
              <View style={pdfStyles.totalRow}>
                <Text style={pdfStyles.totalLabel}>
                  Desconto ({orcamento.desconto}%):
                </Text>
                <Text style={pdfStyles.totalValue}>
                  -{formatCurrency(descontoValor)}
                </Text>
              </View>
            )
          )}
          <View style={pdfStyles.totalRowFinal}>
            <Text style={pdfStyles.totalFinalLabel}>TOTAL:</Text>
            <Text style={pdfStyles.totalFinalValue}>
              {formatCurrency(total)}
            </Text>
          </View>
        </View>

        {orcamento.formaPagamento && (
          <View style={pdfStyles.infoBlock}>
            <Text style={pdfStyles.infoBlockTitle}>Forma de pagamento</Text>
            <Text style={pdfStyles.infoBlockText}>
              {orcamento.formaPagamento}
            </Text>
          </View>
        )}

        {orcamento.observacoes && (
          <View style={pdfStyles.infoBlock}>
            <Text style={pdfStyles.infoBlockTitle}>Observações</Text>
            <Text style={pdfStyles.infoBlockText}>{orcamento.observacoes}</Text>
          </View>
        )}

        {orcamento.assinaturaCliente ? (
          <PdfSignatureFooter
            leftTitle="CONTRATADA"
            leftSubtitle={empresa.razaoSocial}
            rightTitle="CLIENTE"
            rightSubtitle={orcamento.cliente.nome}
            rightSignature={orcamento.assinaturaCliente}
          />
        ) : (
          <PdfAcceptanceFooter />
        )}

        <Text style={pdfStyles.footerNote}>
          {empresa.razaoSocial} — {empresa.telefone} — {empresa.email}
        </Text>
      </Page>
    </Document>
  );
}

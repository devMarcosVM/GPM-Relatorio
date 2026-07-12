import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { formatDate, formatDateTime } from "@/lib/utils";
import { pdfStyles } from "./pdfTheme";
import {
  PdfHeader,
  PdfPartiesRow,
  PdfSectionBanner,
  PdfSignatureFooter,
} from "./PdfParts";

interface RelatorioPDFProps {
  empresa: {
    razaoSocial: string;
    cnpj: string;
    endereco: string;
    telefone: string;
    email: string;
    logoUrl?: string | null;
  };
  relatorio: {
    numero: number;
    dataInicio: string;
    dataFim?: string | null;
    enderecoServico?: string | null;
    observacoes?: string | null;
    assinaturaTecnico?: string | null;
    assinaturaCliente?: string | null;
    cliente: {
      nome: string;
      documento?: string | null;
      telefone?: string | null;
      endereco?: string | null;
    };
    tecnico: { nome: string };
    itens: Array<{
      servico: { nome: string; descricao?: string | null };
      observacoes?: string | null;
      fotos: Array<{
        tipo: string;
        url: string;
        orientacao: string;
      }>;
    }>;
  };
  absoluteUrl: (path: string) => string;
}

function getTecnica(item: RelatorioPDFProps["relatorio"]["itens"][number]) {
  return (
    item.servico.descricao?.trim() ||
    item.observacoes?.trim() ||
    "Conforme executado in loco."
  );
}

export function RelatorioPDF({ empresa, relatorio, absoluteUrl }: RelatorioPDFProps) {
  const itensComFotos = relatorio.itens.filter(
    (item) => item.fotos.some((f) => f.tipo === "ANTES" || f.tipo === "DEPOIS")
  );

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          empresa={empresa}
          title="RELATÓRIO DE SERVIÇO"
          subtitle={`Nº ${String(relatorio.numero).padStart(4, "0")}`}
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
            title: "CONTRATANTE:",
            nome: relatorio.cliente.nome,
            documento: relatorio.cliente.documento,
            endereco: relatorio.enderecoServico || relatorio.cliente.endereco,
            telefone: relatorio.cliente.telefone,
          }}
        />

        <View style={pdfStyles.metaRow}>
          <View style={pdfStyles.metaItem}>
            <Text style={pdfStyles.metaLabel}>Início:</Text>
            <Text style={pdfStyles.metaValue}>
              {formatDateTime(relatorio.dataInicio)}
            </Text>
          </View>
          {relatorio.dataFim && (
            <View style={pdfStyles.metaItem}>
              <Text style={pdfStyles.metaLabel}>Fim:</Text>
              <Text style={pdfStyles.metaValue}>
                {formatDateTime(relatorio.dataFim)}
              </Text>
            </View>
          )}
          <View style={pdfStyles.metaItem}>
            <Text style={pdfStyles.metaLabel}>Responsável:</Text>
            <Text style={pdfStyles.metaValue}>{relatorio.tecnico.nome}</Text>
          </View>
        </View>

        <PdfSectionBanner title="SERVIÇOS" />
        <Text style={pdfStyles.introText}>
          A CONTRATADA atuará nos serviços contratados de acordo com as
          especificações a seguir:
        </Text>

        {relatorio.itens.length === 0 ? (
          <Text style={{ fontSize: 8, color: "#64748b" }}>
            Nenhum serviço registrado.
          </Text>
        ) : (
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colService]}>
                SERVIÇO
              </Text>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colTechnique]}>
                TÉCNICA
              </Text>
            </View>
            {relatorio.itens.map((item, idx) => (
              <View key={idx} style={pdfStyles.tableRow} wrap={false}>
                <Text style={[pdfStyles.tableCell, pdfStyles.colService]}>
                  {item.servico.nome}
                </Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.colTechnique]}>
                  {getTecnica(item)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {itensComFotos.length > 0 && (
          <>
            <PdfSectionBanner title="RESULTADOS" />
            {itensComFotos.map((item, idx) => {
              const fotoAntes = item.fotos.find((f) => f.tipo === "ANTES");
              const fotoDepois = item.fotos.find((f) => f.tipo === "DEPOIS");
              const isVertical =
                fotoAntes?.orientacao === "VERTICAL" ||
                fotoDepois?.orientacao === "VERTICAL";
              const photoStyle = isVertical
                ? pdfStyles.photoVertical
                : pdfStyles.photoHorizontal;

              return (
                <View key={idx} wrap={false}>
                  <Text style={pdfStyles.resultGroupTitle}>
                    {item.servico.nome.toUpperCase()}
                  </Text>
                  <View style={pdfStyles.photoGrid}>
                    <View style={pdfStyles.photoCol}>
                      <Text style={pdfStyles.photoLabel}>ANTES</Text>
                      {fotoAntes ? (
                        <Image
                          src={absoluteUrl(fotoAntes.url)}
                          style={photoStyle}
                        />
                      ) : (
                        <View style={pdfStyles.photoPlaceholder}>
                          <Text style={pdfStyles.photoPlaceholderText}>
                            Sem foto
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={pdfStyles.photoCol}>
                      <Text style={pdfStyles.photoLabel}>DEPOIS</Text>
                      {fotoDepois ? (
                        <Image
                          src={absoluteUrl(fotoDepois.url)}
                          style={photoStyle}
                        />
                      ) : (
                        <View style={pdfStyles.photoPlaceholder}>
                          <Text style={pdfStyles.photoPlaceholderText}>
                            Sem foto
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {relatorio.observacoes && (
          <>
            <PdfSectionBanner title="OBSERVAÇÕES GERAIS" />
            <Text style={{ fontSize: 8.5, lineHeight: 1.4 }}>
              {relatorio.observacoes}
            </Text>
          </>
        )}

        <PdfSignatureFooter
          leftTitle="PRESTADOR DE SERVIÇO"
          leftSubtitle={relatorio.tecnico.nome}
          leftSignature={relatorio.assinaturaTecnico}
          rightTitle="RAZÃO SOCIAL DO CLIENTE"
          rightSubtitle={relatorio.cliente.nome}
          rightSignature={relatorio.assinaturaCliente}
        />

        <Text style={pdfStyles.footerNote}>
          Documento gerado em {formatDate(new Date())}
        </Text>
      </Page>
    </Document>
  );
}

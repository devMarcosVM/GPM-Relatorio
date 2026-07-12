import { View, Text, Image } from "@react-pdf/renderer";
import { pdfStyles } from "./pdfTheme";

interface EmpresaInfo {
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
  logoUrl?: string | null;
}

interface PartyInfo {
  title: string;
  nome: string;
  documento?: string | null;
  endereco?: string | null;
  telefone?: string | null;
}

export function PdfHeader({
  empresa,
  title,
  subtitle,
  absoluteUrl,
}: {
  empresa: EmpresaInfo;
  title: string;
  subtitle?: string;
  absoluteUrl: (path: string) => string;
}) {
  return (
    <View style={pdfStyles.headerRow}>
      <View style={pdfStyles.headerLogoBox}>
        {empresa.logoUrl ? (
          <Image src={absoluteUrl(empresa.logoUrl)} style={pdfStyles.logo} />
        ) : (
          <Text style={{ fontSize: 11, fontWeight: "bold" }}>{empresa.razaoSocial}</Text>
        )}
      </View>
      <View style={pdfStyles.headerBanner}>
        <Text style={pdfStyles.headerBannerText}>{title}</Text>
        {subtitle && <Text style={pdfStyles.headerBannerSub}>{subtitle}</Text>}
      </View>
    </View>
  );
}

export function PdfPartiesRow({
  contratada,
  contratante,
}: {
  contratada: PartyInfo;
  contratante: PartyInfo;
}) {
  return (
    <View style={pdfStyles.partiesRow}>
      <PdfPartyBox party={contratada} />
      <PdfPartyBox party={contratante} />
    </View>
  );
}

function PdfPartyBox({ party }: { party: PartyInfo }) {
  return (
    <View style={pdfStyles.partyBox}>
      <View style={pdfStyles.partyHeader}>
        <Text style={pdfStyles.partyHeaderText}>{party.title}</Text>
      </View>
      <View style={pdfStyles.partyBody}>
        <Text style={pdfStyles.partyName}>{party.nome}</Text>
        {party.documento && (
          <Text style={pdfStyles.partyLine}>CNPJ/CPF: {party.documento}</Text>
        )}
        {party.endereco && (
          <Text style={pdfStyles.partyLine}>{party.endereco}</Text>
        )}
        {party.telefone && (
          <Text style={pdfStyles.partyLine}>Tel: {party.telefone}</Text>
        )}
      </View>
    </View>
  );
}

export function PdfSectionBanner({ title }: { title: string }) {
  return (
    <View style={pdfStyles.sectionBanner}>
      <Text style={pdfStyles.sectionBannerText}>{title}</Text>
    </View>
  );
}

export function PdfSignatureFooter({
  leftTitle,
  leftSubtitle,
  leftSignature,
  rightTitle,
  rightSubtitle,
  rightSignature,
}: {
  leftTitle: string;
  leftSubtitle?: string;
  leftSignature?: string | null;
  rightTitle: string;
  rightSubtitle?: string;
  rightSignature?: string | null;
}) {
  return (
    <View style={pdfStyles.signatureRow}>
      <View style={pdfStyles.signatureBox}>
        <View style={pdfStyles.signatureSpace}>
          {leftSignature && (
            <Image src={leftSignature} style={pdfStyles.signatureImage} />
          )}
        </View>
        <View style={pdfStyles.signatureLine}>
          <Text style={pdfStyles.signatureTitle}>{leftTitle}</Text>
          {leftSubtitle && (
            <Text style={pdfStyles.signatureSubtitle}>{leftSubtitle}</Text>
          )}
        </View>
      </View>
      <View style={pdfStyles.signatureBox}>
        <View style={pdfStyles.signatureSpace}>
          {rightSignature && (
            <Image src={rightSignature} style={pdfStyles.signatureImage} />
          )}
        </View>
        <View style={pdfStyles.signatureLine}>
          <Text style={pdfStyles.signatureTitle}>{rightTitle}</Text>
          {rightSubtitle && (
            <Text style={pdfStyles.signatureSubtitle}>{rightSubtitle}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

export function PdfAcceptanceFooter({ label }: { label?: string }) {
  return (
    <View style={pdfStyles.acceptanceBox}>
      <Text style={pdfStyles.acceptanceText}>
        {label || "Aprovo o orçamento acima descrito e estou de acordo com os valores e condições apresentados."}
      </Text>
      <View style={pdfStyles.acceptanceSignatureSpace} />
      <View style={pdfStyles.acceptanceLine} />
      <Text style={pdfStyles.acceptanceLabel}>Assinatura do cliente</Text>
    </View>
  );
}

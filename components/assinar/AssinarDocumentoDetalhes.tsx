"use client";

import type { DocumentoAssinaturaPublico } from "@/lib/assinatura";
import { toAssetPath } from "@/lib/assetUrl";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  formatPrecoUnitario,
  formatQuantidade,
  normalizeUnidade,
} from "@/lib/unidade";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <p>
      <span className="font-medium text-foreground">{label}:</span>{" "}
      <span className="text-muted">{value}</span>
    </p>
  );
}

export function AssinarDocumentoDetalhes({ info }: { info: DocumentoAssinaturaPublico }) {
  const titulo =
    info.tipo === "relatorio"
      ? `Relatório de Serviço #${String(info.numero).padStart(4, "0")}`
      : `Orçamento #${String(info.numero).padStart(4, "0")}`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{titulo}</h1>
        <p className="text-sm text-muted">{info.empresa.razaoSocial}</p>
      </div>

      <section className="space-y-2 rounded-lg border border-border bg-slate-50 p-4 text-sm">
        <h2 className="font-semibold text-foreground">Contratada</h2>
        <InfoRow label="Razão social" value={info.empresa.razaoSocial} />
        <InfoRow label="CNPJ" value={info.empresa.cnpj} />
        <InfoRow label="Endereço" value={info.empresa.endereco} />
        <InfoRow
          label="Contato"
          value={[info.empresa.telefone, info.empresa.email].filter(Boolean).join(" | ")}
        />
      </section>

      <section className="space-y-2 rounded-lg border border-border bg-slate-50 p-4 text-sm">
        <h2 className="font-semibold text-foreground">Contratante</h2>
        <InfoRow label="Nome" value={info.cliente.nome} />
        <InfoRow label="CPF/CNPJ" value={info.cliente.documento} />
        <InfoRow label="Telefone" value={info.cliente.telefone} />
        <InfoRow label="Endereço" value={info.cliente.endereco} />
        {info.tipo !== "relatorio" && (
          <InfoRow label="Responsável técnico" value={info.responsavelNome} />
        )}
      </section>

      {info.tipo === "relatorio" && info.relatorio && (
        <>
          <section className="space-y-2 rounded-lg border border-border p-4 text-sm">
            <h2 className="font-semibold">Dados do serviço</h2>
            <InfoRow
              label="Local do serviço"
              value={info.relatorio.enderecoServico}
            />
            {info.relatorio.observacoes && (
              <div>
                <p className="font-medium">Observações gerais</p>
                <p className="mt-1 whitespace-pre-wrap text-muted">
                  {info.relatorio.observacoes}
                </p>
              </div>
            )}
            {info.temAssinaturaTecnico && (
              <p className="text-xs font-medium text-green-700">
                Técnico já assinou este documento
              </p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold">Serviços realizados</h2>
            {info.relatorio.itens.length === 0 ? (
              <p className="text-sm text-muted">Nenhum serviço registrado.</p>
            ) : (
              info.relatorio.itens.map((item, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-lg border border-border p-4 text-sm"
                >
                  <p className="font-semibold">{item.servicoNome}</p>
                  {item.servicoDescricao && (
                    <p className="text-muted">{item.servicoDescricao}</p>
                  )}
                  {item.observacoes && (
                    <p className="whitespace-pre-wrap text-muted">
                      <span className="font-medium text-foreground">Obs.: </span>
                      {item.observacoes}
                    </p>
                  )}
                  {item.fotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {item.fotos.map((foto, fi) => (
                        <div key={fi} className="space-y-1">
                          <p className="text-xs font-medium text-muted">
                            {foto.tipo === "ANTES" ? "Antes" : "Depois"}
                          </p>
                          <img
                            src={toAssetPath(foto.url)}
                            alt={`${item.servicoNome} ${foto.tipo}`}
                            className="h-28 w-full rounded-md border border-border object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        </>
      )}

      {info.tipo === "orcamento" && info.orcamento && (
        <>
          <section className="space-y-2 rounded-lg border border-border p-4 text-sm">
            <h2 className="font-semibold">Condições do orçamento</h2>
            <InfoRow label="Data" value={formatDate(info.orcamento.createdAt)} />
            <InfoRow
              label="Validade"
              value={`${info.orcamento.validadeDias} dias`}
            />
            <InfoRow
              label="Forma de pagamento"
              value={info.orcamento.formaPagamento}
            />
            {info.orcamento.observacoes && (
              <div>
                <p className="font-medium">Observações</p>
                <p className="mt-1 whitespace-pre-wrap text-muted">
                  {info.orcamento.observacoes}
                </p>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold">Serviços orçados</h2>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-left text-xs uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2">Serviço</th>
                    <th className="px-3 py-2 text-center">Qtd</th>
                    <th className="px-3 py-2 text-right">Unit.</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {info.orcamento.itens.map((item, index) => {
                    const unidade = normalizeUnidade(item.unidade);
                    return (
                    <tr key={index} className="border-t border-border">
                      <td className="px-3 py-2">
                        <p className="font-medium">{item.servicoNome}</p>
                        {item.servicoDescricao && (
                          <p className="text-xs text-muted">{item.servicoDescricao}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {formatQuantidade(item.quantidade, unidade)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatPrecoUnitario(item.precoUnitario, unidade)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border border-border bg-slate-50 p-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(info.orcamento.subtotal)}</span>
              </div>
              {info.orcamento.desconto > 0 && (
                <div className="flex justify-between text-muted">
                  <span>Desconto ({info.orcamento.desconto}%)</span>
                  <span>
                    -{formatCurrency(info.orcamento.subtotal * (info.orcamento.desconto / 100))}
                  </span>
                </div>
              )}
              {info.orcamento.descontoPacote != null && info.orcamento.descontoPacote > 0 && (
                <div className="flex justify-between text-muted">
                  <span>Desconto pacote</span>
                  <span>-{formatCurrency(info.orcamento.descontoPacote)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-primary">
                <span>Total</span>
                <span>{formatCurrency(info.orcamento.total)}</span>
              </div>
            </div>
          </section>
        </>
      )}

      <p className="text-sm text-muted">
        {info.tipo === "relatorio"
          ? "Revise os serviços acima e confirme com sua assinatura."
          : "Revise os serviços e valores acima e confirme com sua assinatura."}
      </p>
    </div>
  );
}

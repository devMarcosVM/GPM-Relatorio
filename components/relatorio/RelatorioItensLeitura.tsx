"use client";

import { Card } from "@/components/ui/card";
import { toAssetPath } from "@/lib/assetUrl";

interface Foto {
  id: string;
  tipo: string;
  url: string;
}

interface Item {
  id: string;
  servico: { nome: string };
  observacoes?: string | null;
  fotos: Foto[];
}

interface Props {
  itens: Item[];
  enderecoServico?: string | null;
  observacoes?: string | null;
}

export function RelatorioItensLeitura({
  itens,
  enderecoServico,
  observacoes,
}: Props) {
  return (
    <div className="space-y-4">
      {(enderecoServico || observacoes) && (
        <Card className="space-y-2 text-sm">
          {enderecoServico && (
            <p>
              <span className="font-medium">Endereço: </span>
              {enderecoServico}
            </p>
          )}
          {observacoes && (
            <p>
              <span className="font-medium">Observações: </span>
              {observacoes}
            </p>
          )}
        </Card>
      )}

      {itens.length === 0 ? (
        <Card className="py-6 text-center text-sm text-muted">
          Nenhum serviço registrado
        </Card>
      ) : (
        itens.map((item) => {
          const fotoAntes = item.fotos.find((f) => f.tipo === "ANTES");
          const fotoDepois = item.fotos.find((f) => f.tipo === "DEPOIS");

          return (
            <Card key={item.id} className="space-y-3">
              <h3 className="font-medium">{item.servico.nome}</h3>
              {item.observacoes && (
                <p className="text-sm text-muted">{item.observacoes}</p>
              )}
              {(fotoAntes || fotoDepois) && (
                <div className="grid grid-cols-2 gap-3">
                  {fotoAntes ? (
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted">Antes</p>
                      <img
                        src={toAssetPath(fotoAntes.url)}
                        alt="Antes"
                        className="h-28 w-full rounded object-cover"
                      />
                    </div>
                  ) : null}
                  {fotoDepois ? (
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted">Depois</p>
                      <img
                        src={toAssetPath(fotoDepois.url)}
                        alt="Depois"
                        className="h-28 w-full rounded object-cover"
                      />
                    </div>
                  ) : null}
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}

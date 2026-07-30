export function somaCustos(custos: Array<{ valor: number }>): number {
  return custos.reduce((total, custo) => total + (Number(custo.valor) || 0), 0);
}

export function calcularLucro(
  receitaAprovada: number,
  gastos: number
): number {
  return receitaAprovada - gastos;
}

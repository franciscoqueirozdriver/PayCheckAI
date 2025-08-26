// Tipos utilizados no cálculo de DSR

export type PaymentStatus = 'Previsto' | 'Recebido';

export interface Payment {
  id: string;
  dataPagamento: string; // ISO yyyy-MM-dd
  empresa: string;
  tipo: 'Mensalidade' | 'Implantação' | 'Outros';
  parcela: string;
  valorBruto: number;
  percImposto: number;
  percComissao: number;
  status: PaymentStatus;
}

export interface BasesSelecionadas {
  comissaoValorBruto: boolean;
  comissaoValorLiquido: boolean;
  dsrValorBruto: boolean;
  dsrValorLiquido: boolean;
}

export interface AliquotasGlobais {
  imposto: number;
  comissao: number;
  locked: boolean;
}

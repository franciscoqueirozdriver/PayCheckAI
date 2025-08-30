export interface RubricaEntry {
  codigo: string;
  descricao: string;
  quantidade?: string;
  valor_provento?: number;
  valor_desconto?: number;
}

export interface HoleriteRow {
  id_holerite: string;
  mes: string;
  competencia: string;
  empresa: string;
  cnpj_empresa: string;
  colaborador: string;
  cpf_colaborador: string;
  matricula: string;
  cargo: string;
  departamento: string;
  salario_base: number;
  comissao: number;
  dsr: number;
  dias_dsr: string;
  valor_bruto: number;
  valor_liquido: number;
  data_pagamento: string;
  user_email: string;
  fonte_arquivo: string;
  holerite_id: string;
  rubricas_json: string; // JSON encoded
  status_validacao: string;
  total_proventos: number;
  total_descontos: number;
  base_inss: number;
  base_fgts: number;
  base_irrf: number;
  fgts_mes: number;
}

export interface ImportOptions {
  files: string | string[];
  userEmail?: string;
  dataPagamentoDefault?: string;
  ocrEngine?: 'tesseract' | 'vision';
  dedupeMode?: 'update' | 'skip';
  dryRun?: boolean;
}

export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{ file: string; msg: string }>;
}

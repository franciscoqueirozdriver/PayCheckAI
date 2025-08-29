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

// Tipos para o fluxo de importação e revisão
export type HoleriteDraft = {
  id_holerite?: string;
  mes?: string; competencia?: string; empresa?: string; cnpj_empresa?: string;
  colaborador?: string; cpf_colaborador?: string; matricula?: string; cargo?: string; departamento?: string;
  salario_base?: string; comissao?: string; dsr?: string; dias_dsr?: string;
  valor_bruto?: string; valor_liquido?: string; data_pagamento?: string; user_email?: string;
  fonte_arquivo?: string; holerite_id?: string; rubricas_json?: string; status_validacao?: string;
  total_proventos?: string; total_descontos?: string; base_inss?: string; base_fgts?: string; base_irrf?: string; fgts_mes?: string;
};

export type CandidatesMap = Partial<Record<keyof HoleriteDraft, Array<string>>>;

export type ImportPreview = {
  extracted: HoleriteDraft;
  candidates?: CandidatesMap;
  filename: string;
};

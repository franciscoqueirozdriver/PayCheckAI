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

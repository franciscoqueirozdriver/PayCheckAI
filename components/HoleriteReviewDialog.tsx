'use client';

import React, { useEffect, useState } from 'react';

export type Candidate = string | number;
export type Rubrica = { codigo?: string; descricao: string; quantidade?: string; valor_provento?: string; valor_desconto?: string };
export type HoleriteDraft = {
  id_holerite?: string;
  mes?: string; competencia?: string; empresa?: string; cnpj_empresa?: string;
  colaborador?: string; cpf_colaborador?: string; matricula?: string; cargo?: string; departamento?: string;
  salario_base?: string; comissao?: string; dsr?: string; dias_dsr?: string;
  valor_bruto?: string; valor_liquido?: string; data_pagamento?: string; user_email?: string;
  fonte_arquivo?: string; holerite_id?: string; rubricas_json?: string; status_validacao?: string;
  total_proventos?: string; total_descontos?: string; base_inss?: string; base_fgts?: string; base_irrf?: string; fgts_mes?: string;
};
export type CandidatesMap = Partial<Record<keyof HoleriteDraft, Candidate[]>>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  itemIndex: number;
  totalItems: number;
  pdfFile?: File;
  extracted: HoleriteDraft;
  candidates?: CandidatesMap;
  onSave: (finalData: HoleriteDraft) => Promise<void>;
  onPrev: () => void;
  onNext: () => void;
}

const FIELDS: { key: keyof HoleriteDraft; label: string; textarea?: boolean }[] = [
  { key: 'id_holerite', label: 'id_holerite' },
  { key: 'mes', label: 'mes' },
  { key: 'competencia', label: 'competencia' },
  { key: 'empresa', label: 'empresa' },
  { key: 'cnpj_empresa', label: 'cnpj_empresa' },
  { key: 'colaborador', label: 'colaborador' },
  { key: 'cpf_colaborador', label: 'cpf_colaborador' },
  { key: 'matricula', label: 'matricula' },
  { key: 'cargo', label: 'cargo' },
  { key: 'departamento', label: 'departamento' },
  { key: 'salario_base', label: 'salario_base' },
  { key: 'comissao', label: 'comissao' },
  { key: 'dsr', label: 'dsr' },
  { key: 'dias_dsr', label: 'dias_dsr' },
  { key: 'valor_bruto', label: 'valor_bruto' },
  { key: 'valor_liquido', label: 'valor_liquido' },
  { key: 'data_pagamento', label: 'data_pagamento' },
  { key: 'user_email', label: 'user_email' },
  { key: 'fonte_arquivo', label: 'fonte_arquivo' },
  { key: 'holerite_id', label: 'holerite_id' },
  { key: 'rubricas_json', label: 'rubricas_json', textarea: true },
  { key: 'status_validacao', label: 'status_validacao' },
  { key: 'total_proventos', label: 'total_proventos' },
  { key: 'total_descontos', label: 'total_descontos' },
  { key: 'base_inss', label: 'base_inss' },
  { key: 'base_fgts', label: 'base_fgts' },
  { key: 'base_irrf', label: 'base_irrf' },
  { key: 'fgts_mes', label: 'fgts_mes' },
];

export default function HoleriteReviewDialog({ open, onOpenChange, itemIndex, totalItems, pdfFile, extracted, candidates, onSave, onPrev, onNext }: Props) {
  const [data, setData] = useState<HoleriteDraft>(extracted);
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    setData(extracted);
  }, [extracted]);

  useEffect(() => {
    if (pdfFile) {
      const url = URL.createObjectURL(pdfFile);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [pdfFile]);

  if (!open) return null;

  const handleChange = (key: keyof HoleriteDraft, value: string) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-md w-11/12 h-5/6 p-4 flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/2 pr-2 h-full overflow-auto bg-gray-50 flex items-center justify-center">
            {pdfUrl ? (
              <embed src={pdfUrl} className="w-full h-full" />
            ) : (
              <div className="text-sm text-gray-500">Sem preview</div>
            )}
          </div>
          <div className="w-1/2 pl-2 h-full overflow-auto">
            {FIELDS.map(f => (
              <div key={f.key as string} className="mb-3">
                <label className="block text-sm font-medium mb-1">{f.label}</label>
                {f.textarea ? (
                  <textarea
                    value={data[f.key] || ''}
                    onChange={e => handleChange(f.key, e.target.value)}
                    className="w-full border rounded p-2 text-sm"
                    rows={4}
                  />
                ) : (
                  <input
                    value={data[f.key] || ''}
                    onChange={e => handleChange(f.key, e.target.value)}
                    className="w-full border rounded p-2 text-sm"
                  />
                )}
                {candidates && candidates[f.key] && (
                  <select
                    onChange={e => handleChange(f.key, e.target.value)}
                    className="mt-1 w-full border rounded p-1 text-sm"
                    value={data[f.key] || ''}
                  >
                    <option value="">--Selecionar--</option>
                    {candidates[f.key]!.map(c => (
                      <option key={String(c)} value={String(c)}>{String(c)}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="pt-4 flex justify-between items-center">
          <button className="px-4 py-2 rounded-md bg-gray-200" onClick={() => onOpenChange(false)}>Cancelar</button>
          <div className="space-x-2">
            <button className="px-4 py-2 rounded-md bg-gray-200" disabled={itemIndex===0} onClick={onPrev}>Anterior</button>
            <button className="px-4 py-2 rounded-md bg-gray-200" disabled={itemIndex>=totalItems-1} onClick={onNext}>Próximo</button>
            <button className="px-4 py-2 rounded-md bg-blue-600 text-white" onClick={handleSave}>Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { ComboboxEditable } from "./ComboboxEditable";
import { RubricasEditor } from "./RubricasEditor";
import type { HoleriteDraft, CandidatesMap } from "@/models/holerite";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  itemIndex: number;
  totalItems: number;
  file?: File;
  extracted: HoleriteDraft;
  candidates?: CandidatesMap;
  onSave: (finalData: HoleriteDraft) => Promise<void>;
  onPrev: () => void;
  onNext: () => void;
};

const FIELD_ORDER: (keyof HoleriteDraft)[] = [
  "id_holerite",
  "mes","competencia","empresa","cnpj_empresa",
  "colaborador","cpf_colaborador","matricula","cargo","departamento",
  "salario_base","comissao","dsr","dias_dsr",
  "valor_bruto","valor_liquido","data_pagamento","user_email",
  "fonte_arquivo","holerite_id","status_validacao",
  "total_proventos","total_descontos","base_inss","base_fgts","base_irrf","fgts_mes",
];

export default function HoleriteReviewDialog({ open, onOpenChange, itemIndex, totalItems, file, extracted, candidates, onSave, onPrev, onNext }: Props) {
  const [form, setForm] = useState<HoleriteDraft>(extracted || {});
  useEffect(() => { setForm(extracted || {}); }, [extracted, itemIndex]);

  function setField<K extends keyof HoleriteDraft>(key: K, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  const blobUrl = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);
  useEffect(() => () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }, [blobUrl]);

  async function handleSave() {
    const payload: HoleriteDraft = { ...form };
    await onSave(payload);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg max-w-[1200px] w-full p-0 overflow-hidden shadow-lg">
        <div className="px-6 pt-6 border-b">
          <h2 className="text-lg font-semibold">Verifique os dados antes de salvar</h2>
        </div>

        <div className="grid grid-cols-12 gap-0">
          <div className="col-span-5 border-r">
            <div className="p-4">
              {blobUrl ? (
                <embed src={blobUrl} type="application/pdf" className="w-full h-[72vh] rounded-xl border" />
              ) : (
                <div className="text-sm text-gray-500">Sem arquivo para pré-visualizar.</div>
              )}
            </div>
          </div>

          <div className="col-span-7">
            <div className="h-[78vh] overflow-y-auto">
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {FIELD_ORDER.map((key) => (
                    <ComboboxEditable
                      key={key}
                      label={key}
                      value={form[key] as string | undefined}
                      options={candidates?.[key] || []}
                      onChange={(v) => setField(key, v)}
                    />
                  ))}
                </div>

                <hr className="my-4" />

                <RubricasEditor
                  value={form.rubricas_json}
                  onChange={(v) => setField("rubricas_json", v)}
                />
              </div>
            </div>

            <div className="px-6 pb-6 pt-4 flex flex-wrap gap-2 justify-end border-t">
              <button className="px-4 py-2 border rounded-md" onClick={() => onOpenChange(false)}>Cancelar</button>
              <button className="px-4 py-2 border rounded-md disabled:opacity-50" disabled={itemIndex === 0} onClick={onPrev}>Anterior</button>
              <button className="px-4 py-2 border rounded-md disabled:opacity-50" disabled={itemIndex >= totalItems - 1} onClick={onNext}>Próximo</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md" onClick={handleSave}>Salvar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


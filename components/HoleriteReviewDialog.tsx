"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ComboboxEditable } from "@/components/ComboboxEditable";
import { RubricasEditor } from "@/components/RubricasEditor";
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
  const [form, setForm] = useState<HoleriteDraft>(extracted ?? {});
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => { setForm(extracted ?? {}); setConfirmed(false); }, [extracted, itemIndex, open]);

  function setField<K extends keyof HoleriteDraft>(key: K, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  const blobUrl = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);
  useEffect(() => () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }, [blobUrl]);

  async function handleSave() {
    await onSave({ ...form });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Verifique os dados antes de salvar</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-12 gap-0">
          <div className="col-span-5 border-r">
            <div className="p-4">
              {blobUrl ? (
                <embed src={blobUrl} type="application/pdf" className="w-full h-[72vh] rounded-xl border" />
              ) : (
                <div className="text-sm text-muted-foreground">Sem arquivo para pré-visualizar.</div>
              )}
            </div>
          </div>
          <div className="col-span-7">
            <ScrollArea className="h-[78vh]">
              <div className="p-6 space-y-4">
                {confirmed ? (
                  <>
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
                    <Separator />
                    <RubricasEditor
                      value={form.rubricas_json}
                      onChange={(v) => setField("rubricas_json", v)}
                    />
                  </>
                ) : (
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      {FIELD_ORDER.map((key) => (
                        <div key={key}>
                          <span className="font-medium">{key}</span>: {extracted[key] as string | undefined}
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div>
                      <div className="font-medium mb-1">rubricas_json</div>
                      <pre className="bg-muted p-2 rounded whitespace-pre-wrap">
                        {extracted.rubricas_json}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="px-6 pb-6 gap-2">
              {confirmed ? (
                <>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                  <Button variant="outline" disabled={itemIndex === 0} onClick={onPrev}>Anterior</Button>
                  <Button variant="outline" disabled={itemIndex >= totalItems - 1} onClick={onNext}>Próximo</Button>
                  <Button onClick={handleSave}>Salvar</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                  <Button onClick={() => setConfirmed(true)}>Editar</Button>
                </>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { HoleriteDraft, CandidatesMap } from '@/types/holerite';
import { Dropbox } from './Dropbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

const FIELDS: Array<{ key: keyof HoleriteDraft; label: string; placeholder?: string; textarea?: boolean }> = [
  { key: 'empresa', label: 'Empresa' },
  { key: 'cnpj_empresa', label: 'CNPJ da Empresa' },
  { key: 'colaborador', label: 'Colaborador' },
  { key: 'cpf_colaborador', label: 'CPF do Colaborador' },
  { key: 'mes', label: 'Mês (YYYY-MM)', placeholder: 'Ex: 2024-01' },
  { key: 'competencia', label: 'Competência', placeholder: 'Ex: Janeiro de 2024' },
  { key: 'data_pagamento', label: 'Data de Pagamento' },
  { key: 'matricula', label: 'Matrícula' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'departamento', label: 'Departamento' },
  { key: 'salario_base', label: 'Salário Base' },
  { key: 'total_proventos', label: 'Total de Proventos' },
  { key: 'total_descontos', label: 'Total de Descontos' },
  { key: 'valor_liquido', label: 'Valor Líquido' },
  { key: 'base_inss', label: 'Base INSS' },
  { key: 'base_fgts', label: 'Base FGTS' },
  { key: 'base_irrf', label: 'Base IRRF' },
  { key: 'fgts_mes', label: 'FGTS do Mês' },
  { key: 'rubricas_json', label: 'Rubricas (JSON)', textarea: true },
];

export default function HoleriteReviewDialog({ open, onOpenChange, itemIndex, totalItems, pdfFile, extracted, candidates, onSave, onPrev, onNext }: Props) {
  const [form, setForm] = useState<HoleriteDraft>(extracted);
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(extracted);
  }, [extracted]);

  useEffect(() => {
    if (pdfFile) {
      const url = URL.createObjectURL(pdfFile);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [pdfFile]);

  const setField = (key: keyof HoleriteDraft, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await onSave(form);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Revisão de Holerite ({itemIndex + 1} de {totalItems})</DialogTitle>
            </DialogHeader>
            <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
                <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {pdfUrl ? (
                        <embed src={pdfUrl} type="application/pdf" className="w-full h-full" />
                    ) : (
                        <p className="text-gray-500">Preview do PDF não disponível.</p>
                    )}
                </div>
                <div className="overflow-y-auto pr-2 space-y-4">
                    {FIELDS.map(({ key, label, placeholder, textarea }) => (
                        <div key={key}>
                            {textarea ? (
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">{label}</label>
                                    <textarea
                                        value={form[key] || ''}
                                        placeholder={placeholder}
                                        onChange={e => setField(key, e.target.value)}
                                        className="w-full p-2 border rounded-md min-h-[100px] text-xs"
                                    />
                                </div>
                            ) : (
                                <Dropbox
                                    label={label}
                                    value={form[key]}
                                    candidates={candidates?.[key]}
                                    placeholder={placeholder}
                                    onChange={v => setField(key, v)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <DialogFooter className="mt-4">
                <div className="flex justify-between w-full">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={onPrev} disabled={itemIndex <= 0}>Anterior</Button>
                        <span>{itemIndex + 1} / {totalItems}</span>
                        <Button variant="outline" onClick={onNext} disabled={itemIndex >= totalItems - 1}>Próximo</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Salvando...' : 'Salvar e Avançar'}
                        </Button>
                    </div>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}

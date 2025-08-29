import { extractTextFromPdfBuffer } from './holeriteParser';
import { extractFields } from './importHolerites';
import type { HoleriteDraft, CandidatesMap } from '@/models/holerite';

function monthNameToNumber(name: string): string | null {
  const map: Record<string,string> = {
    janeiro:'01', fevereiro:'02', 'março':'03', abril:'04', maio:'05', junho:'06',
    julho:'07', agosto:'08', setembro:'09', outubro:'10', novembro:'11', dezembro:'12'
  };
  const key = name.toLowerCase();
  return map[key] || null;
}

export async function processHoleriteBuffer(buffer: Buffer, opts: { userEmail?: string; filename: string }): Promise<{ extracted: HoleriteDraft; candidates: CandidatesMap }> {
  const text = await extractTextFromPdfBuffer(buffer);
  const row = extractFields(text, { userEmail: opts.userEmail, fonte: opts.filename });
  const extracted: HoleriteDraft = {};
  Object.entries(row).forEach(([k,v]) => {
    (extracted as any)[k] = typeof v === 'number' ? String(v) : (v || '');
  });

  const candidates: CandidatesMap = {};

  const add = (field: keyof HoleriteDraft, values: string[]) => {
    const uniq = Array.from(new Set(values.filter(Boolean)));
    if (uniq.length) candidates[field] = uniq;
  };

  add('empresa', Array.from(text.matchAll(/empresa[:\s]*([\w .-]+)/gi)).map(m=>m[1].trim()));
  add('cnpj_empresa', Array.from(text.matchAll(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g)).map(m=>m[0]));
  add('colaborador', Array.from(text.matchAll(/colaborador[:\s]*([\w .-]+)/gi)).map(m=>m[1].trim()));
  add('cpf_colaborador', Array.from(text.matchAll(/\d{3}\.\d{3}\.\d{3}-\d{2}/g)).map(m=>m[0]));
  add('matricula', Array.from(text.matchAll(/matr[ií]cula[:\s]*([\w.-]+)/gi)).map(m=>m[1].trim()));
  add('cargo', Array.from(text.matchAll(/cargo[:\s]*([\w .-]+)/gi)).map(m=>m[1].trim()));
  add('departamento', Array.from(text.matchAll(/departamento[:\s]*([\w .-]+)/gi)).map(m=>m[1].trim()));
  add('data_pagamento', Array.from(text.matchAll(/pagamento[:\s]*([0-9\/]+)/gi)).map(m=>m[1].trim()));

  const mesMatches = Array.from(text.matchAll(/(?:folha\s*mensal|mes)\s*(\w+)\s*(\d{4})/gi)).map(m=>{
    const mnum = monthNameToNumber(m[1]);
    return mnum ? `${m[2]}-${mnum}` : '';
  }).filter(Boolean);
  add('mes', mesMatches);

  return { extracted, candidates };
}

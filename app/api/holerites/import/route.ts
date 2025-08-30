import { NextResponse } from 'next/server';
import { processHoleriteBuffer } from '@/lib/processHoleriteBuffer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COLS = [
  'id_holerite','mes','competencia','empresa','cnpj_empresa','colaborador','cpf_colaborador',
  'matricula','cargo','departamento','salario_base','comissao','dsr','dias_dsr','valor_bruto',
  'valor_liquido','data_pagamento','user_email','fonte_arquivo','holerite_id','rubricas_json',
  'status_validacao','total_proventos','total_descontos','base_inss','base_fgts','base_irrf','fgts_mes'
] as const;
type ColKey = typeof COLS[number];

const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
function normalizeKeys(obj: Record<string, any>): Record<ColKey, string> {
  const out = {} as Record<ColKey, string>;
  for (const k of COLS) {
    const v = obj?.[k] ?? obj?.[toCamel(k)] ?? '';
    out[k] = v == null ? '' : String(v);
  }
  return out;
}

export async function POST(req: Request) {
  const form = await req.formData();
  const files = form.getAll('files') as File[];
  const userEmail = (form.get('user_email') as string) || '';

  const results: Array<Record<string, any>> = [];
  for (const f of files) {
    if (!(f instanceof File)) continue;
    const buf = Buffer.from(await f.arrayBuffer());
    const parsed = await processHoleriteBuffer(buf, { filename: f.name, userEmail });
    const extracted = normalizeKeys(parsed?.extracted ?? {});
    const candidates = {} as Record<ColKey, string[]>;
    for (const k of COLS) {
      const arr = parsed?.candidates?.[k] ?? parsed?.candidates?.[toCamel(k)];
      candidates[k] = Array.isArray(arr) ? arr.map(String) : [];
    }
    results.push({ extracted, candidates, filename: f.name });
  }

  return NextResponse.json(results, { status: 200 });
}

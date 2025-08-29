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

function normalizeKeys(obj: Record<string, any>): Record<ColKey, string> {
  const out = {} as Record<ColKey, string>;
  for (const k of COLS) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    const v = obj?.[k] ?? obj?.[camel] ?? '';
    out[k] = typeof v === 'string' ? v : v == null ? '' : String(v);
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
    try {
      const parsed = await processHoleriteBuffer(buf, { userEmail, filename: f.name });
      const extracted = normalizeKeys(parsed?.extracted ?? {});
      const candidates = {} as Record<ColKey, string[]>;
      for (const k of COLS) {
        const arr = parsed?.candidates?.[k] ?? parsed?.candidates?.[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())];
        candidates[k] = Array.isArray(arr) ? arr.map(x => String(x)) : [];
      }
      results.push({ extracted, candidates, filename: f.name });
    } catch {
      const extracted = normalizeKeys({});
      const candidates = COLS.reduce((acc, k) => ({ ...acc, [k]: [] as string[] }), {} as Record<ColKey, string[]>);
      results.push({ extracted, candidates, filename: f.name });
    }
  }

  return NextResponse.json(results, { status: 200 });
}

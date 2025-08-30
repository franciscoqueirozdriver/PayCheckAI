import { NextResponse } from 'next/server';
import { getRows, addRow } from '@/lib/googleSheetService';
import { normalizeCurrency, normalizeDate } from '@/lib/holeriteParser';

const SHEET_TITLE = 'Holerite';

const HEADER = ['id_holerite','mes','competencia','empresa','cnpj_empresa','colaborador','cpf_colaborador','matricula','cargo','departamento','salario_base','comissao','dsr','dias_dsr','valor_bruto','valor_liquido','data_pagamento','user_email','fonte_arquivo','holerite_id','rubricas_json','status_validacao','total_proventos','total_descontos','base_inss','base_fgts','base_irrf','fgts_mes'];

const numFields = ['salario_base','comissao','dsr','valor_bruto','valor_liquido','total_proventos','total_descontos','base_inss','base_fgts','base_irrf','fgts_mes'];

export async function POST(req: Request) {
  const draft = await req.json();
  const row: any = {};
  for (const [k,v] of Object.entries(draft)) {
    if (numFields.includes(k)) row[k] = normalizeCurrency(v as string);
    else if (k === 'data_pagamento') row[k] = normalizeDate(v as string);
    else row[k] = v || '';
  }
  const ordered: any = {};
  HEADER.forEach(h => ordered[h] = row[h] ?? '');

  const rows = await getRows(SHEET_TITLE);
  let existing = rows.find(r =>
    r.get('cnpj_empresa') === ordered.cnpj_empresa &&
    r.get('cpf_colaborador') === ordered.cpf_colaborador &&
    r.get('mes') === ordered.mes &&
    r.get('fonte_arquivo') === ordered.fonte_arquivo
  );

  let action: 'inserted' | 'updated' = 'inserted';
  if (existing) {
    HEADER.forEach(key => {
      (existing as any)[key] = ordered[key];
    });
    await existing.save();
    action = 'updated';
  } else {
    await addRow(SHEET_TITLE, ordered);
  }

  return NextResponse.json({ ok: true, id_holerite: ordered.id_holerite, action });
}

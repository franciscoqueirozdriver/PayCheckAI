import { NextResponse } from 'next/server';
import { getRows, addRow } from '@/lib/googleSheetService';
import { normalizeCurrency, normalizeDate } from '@/lib/holeriteParser';

const SHEET_TITLE = 'Holerite';

const numFields = ['salario_base','comissao','dsr','valor_bruto','valor_liquido','total_proventos','total_descontos','base_inss','base_fgts','base_irrf','fgts_mes'];

export async function POST(req: Request) {
  const draft = await req.json();
  const row: any = {};
  for (const [k,v] of Object.entries(draft)) {
    if (numFields.includes(k)) row[k] = normalizeCurrency(v as string);
    else if (k === 'data_pagamento') row[k] = normalizeDate(v as string);
    else row[k] = v || '';
  }

  const rows = await getRows(SHEET_TITLE);
  let existing = rows.find(r =>
    r.get('cnpj_empresa') === row.cnpj_empresa &&
    r.get('cpf_colaborador') === row.cpf_colaborador &&
    r.get('mes') === row.mes &&
    r.get('fonte_arquivo') === row.fonte_arquivo
  );

  let action: 'inserted' | 'updated' = 'inserted';
  if (existing) {
    Object.keys(row).forEach(key => {
      (existing as any)[key] = row[key];
    });
    await existing.save();
    action = 'updated';
  } else {
    await addRow(SHEET_TITLE, row);
  }

  return NextResponse.json({ ok: true, id_holerite: row.id_holerite, action });
}

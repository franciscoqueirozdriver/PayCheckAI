import * as fs from 'fs';
import * as path from 'path';
import { GoogleSpreadsheetRow } from 'google-spreadsheet';
import { extractTextFromPdf, parseRubricas, normalizeCurrency, normalizeDate } from './holeriteParser';
import { HoleriteRow, ImportOptions, ImportResult, RubricaEntry } from '../types/holerite';
import { createHash } from 'crypto';
import * as base32 from 'hi-base32';

const SHEET_TITLE = 'Holerite';
const HEADER = [
  'id_holerite','mes','competencia','empresa','cnpj_empresa','colaborador','cpf_colaborador','matricula','cargo','departamento','salario_base','comissao','dsr','dias_dsr','valor_bruto','valor_liquido','data_pagamento','user_email','fonte_arquivo','holerite_id','rubricas_json','status_validacao','total_proventos','total_descontos','base_inss','base_fgts','base_irrf','fgts_mes'
];

function ensureHeader(sheet: any) {
  if (sheet.headerValues && sheet.headerValues.length === HEADER.length) return;
  sheet.setHeaderRow(HEADER);
}

function generateId(company: string, cnpj: string, colaborador: string, mes: string, fonte: string): string {
  const hash = createHash('sha256').update(`${company}|${cnpj}|${colaborador}|${mes}|${fonte}`).digest();
  return base32.encode(hash).replace(/=+$/,'').slice(0,16);
}

function monthNameToNumber(name: string): string | null {
  const map: Record<string,string> = {
    'janeiro':'01','fevereiro':'02','março':'03','abril':'04','maio':'05','junho':'06','julho':'07','agosto':'08','setembro':'09','outubro':'10','novembro':'11','dezembro':'12'
  };
  name = name.toLowerCase();
  return map[name] || null;
}

function extractFields(text: string, options: {userEmail?: string, dataPagamentoDefault?: string, fonte: string}): HoleriteRow {
  const empresa = matchLine(text, /empresa[:\s]*([\w .-]+)/i);
  const cnpj = formatCnpj(matchLine(text, /cnpj[:\s]*([0-9\.\/-]+)/i));
  const colaborador = matchLine(text, /(colaborador|empregado|funcion\w+)[:\s]*([\w .-]+)/i,2);
  const cpf = formatCpf(matchLine(text, /cpf[:\s]*([0-9\.\/-]+)/i));
  const matricula = matchLine(text, /matr[ií]cula[:\s]*([\w.-]+)/i);
  const cargo = matchLine(text, /cargo[:\s]*([\w .-]+)/i);
  const departamento = matchLine(text, /departamento[:\s]*([\w .-]+)/i);
  // mes/competencia
  let mes = ''; let competencia = '';
  const mesMatch = text.match(/folha\s*mensal\s*(\w+)\s*(\d{4})/i);
  if (mesMatch) {
    const mnum = monthNameToNumber(mesMatch[1]);
    if (mnum) {
      mes = `${mesMatch[2]}-${mnum}`;
      competencia = `${mesMatch[1]} de ${mesMatch[2]}`;
    }
  }
  const rubricas = parseRubricas(text);
  const salarioBase = findValue(rubricas, /sal[aá]rio/i);
  const comissao = sumValues(rubricas, /comiss/i);
  const dsrRubricas = rubricas.filter(r => /dsr|repouso/i.test(r.descricao));
  const dsr = dsrRubricas.reduce((s,r)=> s + (r.valor_provento||0) - (r.valor_desconto||0),0);
  const diasDsr = dsrRubricas[0]?.quantidade || '';
  const totalProventos = rubricas.reduce((s,r)=> s + (r.valor_provento||0),0);
  const totalDescontos = rubricas.reduce((s,r)=> s + (r.valor_desconto||0),0);
  const valorLiquido = Math.max(totalProventos - totalDescontos, 0);
  const valorBruto = totalProventos;
  const bases = extractBases(text);
  const dataPagamento = normalizeDate(matchLine(text, /pagamento[:\s]*([0-9\/]+)/i)) || (options.dataPagamentoDefault||'');
  const holeriteId = matchLine(text, /holerite\s*[:#]?\s*(\w+)/i);
  const id = generateId(empresa, cnpj, colaborador, mes, options.fonte);
  const statusOk = empresa && cnpj && colaborador && cpf && mes && totalProventos>0 && totalDescontos>=0 && valorLiquido>=0;
  return {
    id_holerite: id,
    mes,
    competencia,
    empresa,
    cnpj_empresa: cnpj,
    colaborador,
    cpf_colaborador: cpf,
    matricula,
    cargo,
    departamento,
    salario_base: salarioBase,
    comissao,
    dsr,
    dias_dsr: diasDsr,
    valor_bruto: valorBruto,
    valor_liquido: valorLiquido,
    data_pagamento: dataPagamento,
    user_email: options.userEmail || '',
    fonte_arquivo: options.fonte,
    holerite_id: holeriteId || id,
    rubricas_json: JSON.stringify(rubricas),
    status_validacao: statusOk? 'ok':'pendente',
    total_proventos: totalProventos,
    total_descontos: totalDescontos,
    base_inss: bases.base_inss,
    base_fgts: bases.base_fgts,
    base_irrf: bases.base_irrf,
    fgts_mes: bases.fgts_mes
  };
}

function matchLine(text: string, regex: RegExp, index: number=1): string {
  const m = text.match(regex);
  return m? m[index].trim() : '';
}

function formatCnpj(v: string): string {
  const digits = v.replace(/\D/g,'');
  if (digits.length !== 14) return v || '';
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function formatCpf(v: string): string {
  const digits = v.replace(/\D/g,'');
  if (digits.length !== 11) return v || '';
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function findValue(rubricas: RubricaEntry[], pattern: RegExp): number {
  const r = rubricas.find(r=> pattern.test(r.descricao));
  if (!r) return 0;
  return (r.valor_provento||0) - (r.valor_desconto||0);
}

function sumValues(rubricas: RubricaEntry[], pattern: RegExp): number {
  return rubricas.filter(r=> pattern.test(r.descricao)).reduce((s,r)=> s + (r.valor_provento||0) - (r.valor_desconto||0),0);
}

function extractBases(text: string) {
  const base_inss = normalizeCurrency(matchLine(text, /base\s+inss\s*[:\s]*([0-9.,]+)/i));
  const base_fgts = normalizeCurrency(matchLine(text, /base\s+fgts\s*[:\s]*([0-9.,]+)/i));
  const base_irrf = normalizeCurrency(matchLine(text, /base\s+irrf\s*[:\s]*([0-9.,]+)/i));
  const fgts_mes = normalizeCurrency(matchLine(text, /fgts\s+do\s+m[eê]s\s*[:\s]*([0-9.,]+)/i));
  return { base_inss, base_fgts, base_irrf, fgts_mes };
}

function readFiles(target: string): string[] {
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    return fs.readdirSync(target).filter(f=> f.toLowerCase().endsWith('.pdf')).map(f=> path.join(target,f));
  }
  return [target];
}

async function loadSheet() {
  const { GoogleSpreadsheet } = await import('google-spreadsheet');
  const { JWT } = await import('google-auth-library');
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.SPREADSHEET_ID) {
    throw new Error('Credenciais do Google Sheets ausentes');
  }
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g,'\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  let sheet = doc.sheetsByTitle[SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({ title: SHEET_TITLE, headerValues: HEADER });
  } else if (sheet.headerValues.length === 0) {
    sheet.setHeaderRow(HEADER);
  }
  return sheet;
}

function findRow(sheetRows: GoogleSpreadsheetRow<any>[], row: HoleriteRow): GoogleSpreadsheetRow<any> | undefined {
  return sheetRows.find(r=>
    r.get('cnpj_empresa') === row.cnpj_empresa &&
    r.get('cpf_colaborador') === row.cpf_colaborador &&
    r.get('mes') === row.mes &&
    r.get('fonte_arquivo') === row.fonte_arquivo
  );
}

export async function importHolerites(opts: ImportOptions): Promise<ImportResult> {
  const files = Array.isArray(opts.files) ? opts.files : readFiles(opts.files);
  const sheet = await loadSheet();
  ensureHeader(sheet);
  const existing = await sheet.getRows();
  const result: ImportResult = { inserted:0, updated:0, skipped:0, errors:[] };

  for (const file of files) {
    try {
      const text = await extractTextFromPdf(file, opts.ocrEngine || 'tesseract');
      const row = extractFields(text, { userEmail: opts.userEmail, dataPagamentoDefault: opts.dataPagamentoDefault, fonte: path.basename(file) });
      if (opts.dryRun) {
        result.inserted++; // Count as processed
        continue;
      }
      const found = findRow(existing, row);
      if (found) {
        if (opts.dedupeMode === 'skip') { result.skipped++; continue; }
        HEADER.forEach(h=> { // update row
          (found as any)[h] = (row as any)[h];
        });
        await found.save();
        result.updated++;
      } else {
        const obj: any = {};
        HEADER.forEach(h=> obj[h] = (row as any)[h] || '');
        await sheet.addRow(obj);
        result.inserted++;
      }
    } catch (err:any) {
      result.errors.push({ file, msg: err.message });
    }
  }
  return result;
}

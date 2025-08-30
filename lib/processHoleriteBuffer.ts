import { extractTextFromPdfBuffer, parseRubricas } from './holeriteParser';
import type { HoleriteDraft, CandidatesMap } from '@/models/holerite';
import { createHash } from 'crypto';
import * as base32 from 'hi-base32';

const MONTHS: Record<string,string> = {
  janeiro:'01', fevereiro:'02', 'março':'03', abril:'04', maio:'05', junho:'06',
  julho:'07', agosto:'08', setembro:'09', outubro:'10', novembro:'11', dezembro:'12'
};

function monthNameToNumber(name: string): string | undefined {
  return MONTHS[name.toLowerCase()];
}

function normalizeTextBR(t: string): string {
  return t.replace(/[ \t]+/g, ' ').replace(/\r/g,'').trim();
}

function toBRNumber(v?: string): number {
  if (!v) return 0;
  const s = v.replace(/[^0-9,-]/g, '').replace(/\.(?=\d{3})/g,'').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function toMoneyStr(n?: number): string {
  if (!n || isNaN(n)) return '';
  return n.toFixed(2);
}

function toISODate(v?: string): string {
  if (!v) return '';
  const m = v.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return '';
  const [_, d, mo, y] = m;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year.padStart(4,'0')}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
}

function uniq(arr: Array<string|undefined>): string[] {
  return Array.from(new Set(arr.filter(Boolean) as string[]));
}

function generateId(company: string, cnpj: string, colaborador: string, mes: string, fonte: string): string {
  const hash = createHash('sha256').update(`${company}|${cnpj}|${colaborador}|${mes}|${fonte}`).digest();
  return base32.encode(hash).replace(/=+$/,'').slice(0,16);
}

export async function processHoleriteBuffer(buffer: Buffer, opts: { filename: string; userEmail?: string }): Promise<{ extracted: HoleriteDraft; candidates: CandidatesMap }> {
  const raw = await extractTextFromPdfBuffer(buffer);
  const text = normalizeTextBR(raw);
  const lines = text.split('\n');

  // Empresa
  const empresaCandidates: string[] = [];
  for (let i=0;i<lines.length;i++) {
    if (/CNPJ[:\s]/i.test(lines[i])) {
      for (let j=i-1;j>=0;j--) {
        const prev = lines[j].trim();
        if (prev && /^[A-Z0-9ÁÉÍÓÚÂÊÔÃÕÇ .,&\/\-]{6,}$/.test(prev)) {
          empresaCandidates.push(prev);
          break;
        }
      }
    }
  }
  const empresa = empresaCandidates[0] || '';

  // CNPJ / CPF
  const cnpjMatches = Array.from(text.matchAll(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g)).map(m=>m[0]);
  const cnpj_empresa = cnpjMatches[0] || '';

  const cpfMatches = Array.from(text.matchAll(/\d{3}\.\d{3}\.\d{3}-\d{2}/g)).map(m=>m[0]);
  const cpf_colaborador = cpfMatches[0] || '';

  // Colaborador
  const colaboradorMatches: string[] = [];
  const colRegex = /(FUNCION[ÁA]RIO|EMPREGADO|COLABORADOR)\s*[:\-]?\s*([A-ZÁ-Ú ]{3,})/gi;
  let colM: RegExpExecArray | null;
  while ((colM = colRegex.exec(text))) {
    colaboradorMatches.push(colM[2].trim());
  }
  const colaborador = colaboradorMatches[0] || '';

  // Matricula / Cargo / Departamento
  const matricula = Array.from(text.matchAll(/Matr[ií]cula\s*[:\-]?\s*([A-Z0-9\-\.\/]+)/gi)).map(m=>m[1].trim())[0] || '';
  const cargo = Array.from(text.matchAll(/Cargo\s*[:\-]\s*([^\n]+)/gi)).map(m=>m[1].trim())[0] || '';
  const departamento = Array.from(text.matchAll(/(?:Depto\.?|Departamento)\s*[:\-]\s*([^\n]+)/gi)).map(m=>m[1].trim())[0] || '';

  // Mes / Competencia
  const mesIsoCandidates: string[] = [];
  const mesTextoCandidates: string[] = [];
  const monthRegex = /(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(20\d{2})/gi;
  let mm: RegExpExecArray | null;
  while ((mm = monthRegex.exec(text))) {
    const num = monthNameToNumber(mm[1]);
    if (num) {
      mesIsoCandidates.push(`${mm[2]}-${num}`);
      mesTextoCandidates.push(`${mm[1][0].toUpperCase()}${mm[1].slice(1).toLowerCase()} de ${mm[2]}`);
    }
  }
  const mes = mesIsoCandidates[0] || '';
  const competencia = mesTextoCandidates[0] || '';

  // Datas pagamento
  const dateMatches = Array.from(text.matchAll(/\d{2}\/\d{2}\/\d{4}/g)).map(m=>m[0]);
  const data_pagamento = toISODate(dateMatches[0]);
  const dataPagtoCandidates = uniq(dateMatches.map(toISODate));

  // Rubricas
  const rubricas = parseRubricas(text);
  const rubricas_json = JSON.stringify(rubricas);
  const totalProventosNum = rubricas.reduce((s,r)=>s+(r.valor_provento||0),0);
  const totalDescontosNum = rubricas.reduce((s,r)=>s+(r.valor_desconto||0),0);
  const valorLiquidoNum = totalProventosNum - totalDescontosNum;
  const salarioBaseRub = rubricas.find(r=>/SAL[ÁA]RIO/.test(r.descricao));
  const salarioBaseNum = salarioBaseRub ? (salarioBaseRub.valor_provento||0) - (salarioBaseRub.valor_desconto||0) : 0;
  const comissaoNum = rubricas.filter(r=>/COMISS/i.test(r.descricao)).reduce((s,r)=>s+(r.valor_provento||0)-(r.valor_desconto||0),0);
  const dsrRub = rubricas.filter(r=>/\bDSR\b|DESCANSO SEMANAL REMUNERADO|REP\.\s*REM/i.test(r.descricao));
  const dsrNum = dsrRub.reduce((s,r)=>s+(r.valor_provento||0)-(r.valor_desconto||0),0);
  const diasDsr = dsrRub[0]?.quantidade || '';

  // Bases
  const baseInssMatches = Array.from(text.matchAll(/base\s+inss\s*[:\s]*([0-9.,]+)/gi)).map(m=>m[1]);
  const baseFgtsMatches = Array.from(text.matchAll(/base\s+fgts\s*[:\s]*([0-9.,]+)/gi)).map(m=>m[1]);
  const baseIrrfMatches = Array.from(text.matchAll(/base\s+irrf\s*[:\s]*([0-9.,]+)/gi)).map(m=>m[1]);
  const fgtsMesMatches = Array.from(text.matchAll(/fgts\s+do\s+m[eê]s\s*[:\s]*([0-9.,]+)/gi)).map(m=>m[1]);

  const base_inss_num = toBRNumber(baseInssMatches[0]);
  const base_fgts_num = toBRNumber(baseFgtsMatches[0]);
  const base_irrf_num = toBRNumber(baseIrrfMatches[0]);
  const fgts_mes_num = toBRNumber(fgtsMesMatches[0]);

  const extracted: HoleriteDraft = {
    id_holerite: '',
    mes,
    competencia,
    empresa,
    cnpj_empresa,
    colaborador,
    cpf_colaborador,
    matricula,
    cargo,
    departamento,
    salario_base: toMoneyStr(salarioBaseNum),
    comissao: toMoneyStr(comissaoNum),
    dsr: toMoneyStr(dsrNum),
    dias_dsr: diasDsr ? String(diasDsr) : '',
    valor_bruto: toMoneyStr(totalProventosNum),
    valor_liquido: toMoneyStr(valorLiquidoNum),
    data_pagamento,
    user_email: opts.userEmail || '',
    fonte_arquivo: opts.filename,
    holerite_id: Array.from(text.matchAll(/holerite\s*[:#]?\s*(\w+)/i)).map(m=>m[1])[0] || '',
    rubricas_json,
    status_validacao: '',
    total_proventos: toMoneyStr(totalProventosNum),
    total_descontos: toMoneyStr(totalDescontosNum),
    base_inss: toMoneyStr(base_inss_num),
    base_fgts: toMoneyStr(base_fgts_num),
    base_irrf: toMoneyStr(base_irrf_num),
    fgts_mes: toMoneyStr(fgts_mes_num),
  };

  extracted.id_holerite = generateId(extracted.empresa||'', extracted.cnpj_empresa||'', extracted.colaborador||'', extracted.mes||'', opts.filename);
  if (!extracted.holerite_id) extracted.holerite_id = extracted.id_holerite;
  const critical = [extracted.empresa, extracted.cnpj_empresa, extracted.colaborador, extracted.cpf_colaborador, extracted.mes, extracted.total_proventos, extracted.total_descontos, extracted.valor_liquido];
  extracted.status_validacao = critical.every(Boolean) ? 'ok' : 'pendente';

  const candidates: CandidatesMap = {
    empresa: uniq(empresaCandidates),
    cnpj_empresa: uniq(cnpjMatches),
    colaborador: uniq(colaboradorMatches),
    cpf_colaborador: uniq(cpfMatches),
    mes: uniq(mesIsoCandidates),
    competencia: uniq(mesTextoCandidates),
    data_pagamento: dataPagtoCandidates,
    salario_base: uniq([toMoneyStr(salarioBaseNum)]),
    comissao: uniq([toMoneyStr(comissaoNum), ...rubricas.filter(r=>/COMISS/i.test(r.descricao)).map(r=>toMoneyStr((r.valor_provento||0)-(r.valor_desconto||0)))]),
    dsr: uniq([toMoneyStr(dsrNum)]),
    dias_dsr: uniq(dsrRub.map(r=>r.quantidade).filter(Boolean) as string[]),
    total_proventos: uniq([toMoneyStr(totalProventosNum)]),
    total_descontos: uniq([toMoneyStr(totalDescontosNum)]),
    valor_liquido: uniq([toMoneyStr(valorLiquidoNum)]),
    base_inss: uniq(baseInssMatches.map(v=>toMoneyStr(toBRNumber(v)))),
    base_fgts: uniq(baseFgtsMatches.map(v=>toMoneyStr(toBRNumber(v)))),
    base_irrf: uniq(baseIrrfMatches.map(v=>toMoneyStr(toBRNumber(v)))),
    fgts_mes: uniq(fgtsMesMatches.map(v=>toMoneyStr(toBRNumber(v)))),
  };

  return { extracted, candidates };
}

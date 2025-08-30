import { extractPdfText, extractTextFromPdfBuffer, parseRubricas } from './holeriteParser';
import { runTextract } from './textract';
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
  if (n == null || isNaN(n)) return '';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

function normalizeKey(s: string): string {
  return s.normalize('NFD').replace(/[^a-z0-9 ]/gi,'').toLowerCase();
}

function fromKV(kv: Record<string,string>, keys: string[]): string {
  const map: Record<string,string> = {};
  for (const [k,v] of Object.entries(kv)) map[normalizeKey(k)] = v;
  for (const k of keys) {
    const norm = normalizeKey(k);
    for (const [kk,vv] of Object.entries(map)) {
      if (kk.includes(norm)) return vv;
    }
  }
  return '';
}

function cleanBR(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function isMoneyBR(s: string): boolean {
  return /\d/.test(s) && /\d{1,3}(?:\.\d{3})*,\d{2}/.test(s.replace(/\s+/g,''));
}

type Rubrica = {
  codigo?: string;
  descricao: string;
  quantidade?: string;
  valor_provento?: string;
  valor_desconto?: string;
};

function parseRubricasFromTables(tables: string[][][]): Rubrica[] {
  let bestScore = 0;
  const scored: Array<{ table: string[][]; score: number; mapping: Record<string, number> }> = [];
  for (const table of tables) {
    if (!table.length) continue;
    const header = table[0].map(h => normalizeKey(h));
    const mapping: Record<string, number> = {};
    const patterns: Record<string, RegExp> = {
      codigo: /^c(ó|o)d(igo)?|cod$/i,
      descricao: /descri(c|ç)ao|evento/i,
      quantidade: /refer(e|ê)ncia|qtd|qtde/i,
      provento: /venc(i|í)mentos|proventos/i,
      desconto: /descontos?/i,
    };
    let score = 0;
    header.forEach((h, idx) => {
      for (const [k, r] of Object.entries(patterns)) {
        if (r.test(h)) {
          mapping[k] = idx;
          score++;
          break;
        }
      }
    });
    if (score > 0) {
      scored.push({ table, score, mapping });
      if (score > bestScore) bestScore = score;
    }
  }

  const rubricas: Rubrica[] = [];
  for (const s of scored.filter(s => s.score === bestScore)) {
    const { table, mapping } = s;
    for (const row of table.slice(1)) {
      const codigo = mapping.codigo !== undefined ? cleanBR(row[mapping.codigo] || '') : undefined;
      const descricao = cleanBR(row[mapping.descricao] || '');
      if (!descricao || /^total/i.test(descricao)) continue;
      const quantidade = mapping.quantidade !== undefined ? cleanBR(row[mapping.quantidade] || '') : undefined;
      const proventoStr = mapping.provento !== undefined ? cleanBR(row[mapping.provento] || '') : '';
      const descontoStr = mapping.desconto !== undefined ? cleanBR(row[mapping.desconto] || '') : '';
      const isEmpty = [codigo, descricao, quantidade, proventoStr, descontoStr].every(v => !v);
      if (isEmpty || /^[-]+$/.test(descricao)) continue;
      const valor_provento = isMoneyBR(proventoStr) ? proventoStr : '';
      const valor_desconto = isMoneyBR(descontoStr) ? descontoStr : '';
      rubricas.push({ codigo, descricao, quantidade, valor_provento, valor_desconto });
    }
  }
  return rubricas;
}

export async function processHoleriteBuffer(buffer: Buffer, opts: { filename: string; userEmail?: string }): Promise<{ extracted: HoleriteDraft; candidates: CandidatesMap }> {
  // quick attempt with pdf-parse
  let text = '';
  try { text = await extractPdfText(buffer); } catch {}
  text = normalizeTextBR(text);
  const goodPdf = /CNPJ/i.test(text) && /(L[íi]quido|Liquido)/i.test(text);

  let kv: Record<string,string> = {};
  let tables: string[][][] = [];

  if (!goodPdf) {
    try {
      const tex = await runTextract(buffer, opts.filename);
      text = normalizeTextBR(tex.text || '');
      kv = tex.kv;
      tables = tex.tables;
    } catch {
      const fallback = await extractTextFromPdfBuffer(buffer);
      text = normalizeTextBR(fallback);
    }
  }

  // parse using text (and tables/kv when available)
  const lines = text.split('\n');
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
  const empresaKV = fromKV(kv, ['empresa']);
  if (empresaKV) empresaCandidates.unshift(empresaKV);
  const empresa = empresaCandidates[0] || '';

  const cnpjMatches = Array.from(text.matchAll(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g)).map(m=>m[0]);
  const cnpjKV = fromKV(kv, ['cnpj']);
  if (cnpjKV) cnpjMatches.unshift(cnpjKV);
  const cnpj_empresa = cnpjMatches[0] || '';

  const cpfMatches = Array.from(text.matchAll(/\d{3}\.\d{3}\.\d{3}-\d{2}/g)).map(m=>m[0]);
  const cpfKV = fromKV(kv, ['cpf']);
  if (cpfKV) cpfMatches.unshift(cpfKV);
  const cpf_colaborador = cpfMatches[0] || '';

  const colaboradorMatches: string[] = [];
  const colRegex = /(FUNCION[ÁA]RIO|EMPREGADO|COLABORADOR)\s*[:\-]?\s*([A-ZÁ-Ú ]{3,})/gi;
  let colM: RegExpExecArray | null;
  while ((colM = colRegex.exec(text))) colaboradorMatches.push(colM[2].trim());
  const colKV = fromKV(kv, ['funcionário','empregado','colaborador','nome']);
  if (colKV) colaboradorMatches.unshift(colKV);
  const colaborador = colaboradorMatches[0] || '';

  const matricula = fromKV(kv, ['matr']);
  const cargo = fromKV(kv, ['cargo']);
  const departamento = fromKV(kv, ['departamento','depto']);

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
  const compKV = fromKV(kv, ['competência','folha mensal','mês']);
  if (compKV) {
    const m = monthRegex.exec(compKV);
    if (m) {
      const num = monthNameToNumber(m[1]);
      if (num) {
        mesIsoCandidates.unshift(`${m[2]}-${num}`);
        mesTextoCandidates.unshift(`${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()} de ${m[2]}`);
      }
    }
  }
  const mes = mesIsoCandidates[0] || '';
  const competencia = mesTextoCandidates[0] || '';

  const dateMatches = Array.from(text.matchAll(/\d{2}\/\d{2}\/\d{4}/g)).map(m=>m[0]);
  const dateKV = fromKV(kv, ['pagamento','vencimento']);
  if (dateKV) dateMatches.unshift(dateKV);
  const data_pagamento = toISODate(dateMatches[0]);
  const dataPagtoCandidates = uniq(dateMatches.map(toISODate));

  let rubricas: Rubrica[] = tables.length ? parseRubricasFromTables(tables) : [];
  if (!rubricas.length) {
    const fallback = parseRubricas(text);
    rubricas = fallback.map(r => ({
      codigo: r.codigo,
      descricao: r.descricao,
      quantidade: r.quantidade,
      valor_provento: r.valor_provento ? toMoneyStr(r.valor_provento) : '',
      valor_desconto: r.valor_desconto ? toMoneyStr(r.valor_desconto) : '',
    }));
  }
  const rubricas_json = JSON.stringify(rubricas);

  const totalProventosNum = rubricas.reduce((s,r)=>s+toBRNumber(r.valor_provento),0);
  const totalDescontosNum = rubricas.reduce((s,r)=>s+toBRNumber(r.valor_desconto),0);
  const totalProventosKV = fromKV(kv,['total proventos','total vencimentos']);
  const totalDescontosKV = fromKV(kv,['total descontos']);
  const liquidoKV = fromKV(kv,['líquido a receber','líquido']);
  const totalProventos = totalProventosKV ? toBRNumber(totalProventosKV) : totalProventosNum;
  const totalDescontos = totalDescontosKV ? toBRNumber(totalDescontosKV) : totalDescontosNum;
  const valorLiquidoNum = liquidoKV ? toBRNumber(liquidoKV) : (totalProventos - totalDescontos);
  const salarioBaseRub = rubricas.find(r=>/SAL[ÁA]RIO\s*BASE/i.test(r.descricao));
  const salarioBaseNum = salarioBaseRub ? toBRNumber(salarioBaseRub.valor_provento) - toBRNumber(salarioBaseRub.valor_desconto) : 0;
  const comissaoRub = rubricas.filter(r=>/COMISS(ÃO|AO)?/i.test(r.descricao));
  const comissaoNum = comissaoRub.reduce((s,r)=>s+toBRNumber(r.valor_provento) - toBRNumber(r.valor_desconto),0);
  const dsrRub = rubricas.filter(r=>/\bDSR\b|DESCANSO SEMANAL REMUNERADO|REP\.\s*REM/i.test(r.descricao));
  const dsrNum = dsrRub.reduce((s,r)=>s+toBRNumber(r.valor_provento) - toBRNumber(r.valor_desconto),0);
  const diasDsr = dsrRub[0]?.quantidade || '';

  const base_inss_num = toBRNumber(fromKV(kv,['base inss']) || '');
  const base_fgts_num = toBRNumber(fromKV(kv,['base fgts']) || '');
  const base_irrf_num = toBRNumber(fromKV(kv,['base irrf']) || '');
  const fgts_mes_num = toBRNumber(fromKV(kv,['fgts mês','fgts mes']) || '');

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
    valor_bruto: toMoneyStr(totalProventos),
    valor_liquido: toMoneyStr(valorLiquidoNum),
    data_pagamento,
    user_email: opts.userEmail || '',
    fonte_arquivo: opts.filename,
    holerite_id: fromKV(kv,['holerite']) || '',
    rubricas_json,
    status_validacao: '',
    total_proventos: toMoneyStr(totalProventos),
    total_descontos: toMoneyStr(totalDescontos),
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
    empresa: uniq([empresaKV, ...empresaCandidates]),
    cnpj_empresa: uniq([cnpjKV, ...cnpjMatches]),
    colaborador: uniq([colKV, ...colaboradorMatches]),
    cpf_colaborador: uniq([cpfKV, ...cpfMatches]),
    mes: uniq(mesIsoCandidates),
    competencia: uniq(mesTextoCandidates),
    data_pagamento: dataPagtoCandidates,
    salario_base: uniq([toMoneyStr(salarioBaseNum), salarioBaseRub?.valor_provento || '', salarioBaseRub?.valor_desconto || ''].filter(Boolean)),
    comissao: uniq([toMoneyStr(comissaoNum), ...comissaoRub.map(r=>toMoneyStr(toBRNumber(r.valor_provento) - toBRNumber(r.valor_desconto)))]),
    dsr: uniq([toMoneyStr(dsrNum), ...dsrRub.map(r=>toMoneyStr(toBRNumber(r.valor_provento) - toBRNumber(r.valor_desconto)))]),
    dias_dsr: uniq(dsrRub.map(r=>r.quantidade).filter(Boolean) as string[]),
    total_proventos: uniq([toMoneyStr(totalProventos), totalProventosKV && cleanBR(totalProventosKV)].filter(Boolean)),
    total_descontos: uniq([toMoneyStr(totalDescontos), totalDescontosKV && cleanBR(totalDescontosKV)].filter(Boolean)),
    valor_liquido: uniq([toMoneyStr(valorLiquidoNum), liquidoKV && cleanBR(liquidoKV)].filter(Boolean)),
    base_inss: uniq([toMoneyStr(base_inss_num)]),
    base_fgts: uniq([toMoneyStr(base_fgts_num)]),
    base_irrf: uniq([toMoneyStr(base_irrf_num)]),
    fgts_mes: uniq([toMoneyStr(fgts_mes_num)]),
  };

  return { extracted, candidates };
}

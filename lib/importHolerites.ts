import { normalizeCurrency, normalizeDate, parseRubricas } from './holeriteParser';
import type { HoleriteDraft, CandidatesMap } from '@/models/holerite';
import { createHash } from 'crypto';
import * as base32 from 'hi-base32';

// --- Helper Functions ---

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

function findValue(rubricas: any[], pattern: RegExp): number {
  const r = rubricas.find(r=> pattern.test(r.descricao));
  if (!r) return 0;
  return (r.valor_provento||0) - (r.valor_desconto||0);
}

function sumValues(rubricas: any[], pattern: RegExp): number {
  return rubricas.filter(r=> pattern.test(r.descricao)).reduce((s,r)=> s + (r.valor_provento||0) - (r.valor_desconto||0),0);
}

function matchAll(text: string, regex: RegExp, index: number = 1): string[] {
  const globalRegex = new RegExp(regex.source, 'gi');
  const matches = Array.from(text.matchAll(globalRegex));
  const unique = new Set(matches.map(m => m[index].trim()));
  return Array.from(unique).filter(Boolean);
}

// --- Main Extraction Logic ---

export function processHoleriteText(text: string, options: { userEmail?: string, fonte: string }): { extracted: HoleriteDraft, candidates: CandidatesMap } {
    const candidates: CandidatesMap = {};
    const extracted: HoleriteDraft = {};

    const addField = (key: keyof HoleriteDraft, regex: RegExp, group: number = 1, formatter?: (val: string) => string) => {
        const all = matchAll(text, regex, group);
        const cleaned = all.map(v => v.replace(/\s{2,}.*/, '').trim());
        const formatted = formatter ? cleaned.map(formatter) : cleaned;

        // Add to candidates without overwriting
        if (!candidates[key]) candidates[key] = [];
        candidates[key]!.push(...formatted);
        candidates[key] = Array.from(new Set(candidates[key]));


        if (!extracted[key] || extracted[key] === '') {
            extracted[key] = candidates[key]?.[0] || '';
        }
    };

    const addNumericField = (key: keyof HoleriteDraft, regex: RegExp, group: number = 1) => {
        const all = matchAll(text, regex, group).map(v => String(normalizeCurrency(v)));

        if (!candidates[key]) candidates[key] = [];
        candidates[key]!.push(...all);
        candidates[key] = Array.from(new Set(candidates[key]));

        if (!extracted[key] || extracted[key] === '0') {
            extracted[key] = candidates[key]?.[0] || '0';
        }
    };

    // --- Specific patterns from user sample first ---
    addNumericField('salario_base', /Salário Base\s*:\s*R?\$\s*([0-9.,]+)/i, 1);
    addNumericField('base_inss', /Salário Contribuição INSS\s*:\s*R?\$\s*([0-9.,]+)/i, 1);
    addNumericField('base_fgts', /Base Cálculo FGTS\s*:\s*R?\$\s*([0-9.,]+)/i, 1);
    addNumericField('fgts_mes', /FGTS do Mês\s*:\s*R?\$\s*([0-9.,]+)/i, 1);
    addNumericField('base_irrf', /Base Cálculo IRRF\s*:\s*R?\$\s*([0-9.,]+)/i, 1);
    addNumericField('total_proventos', /(?:➡️\s*)?Total de Vencimentos\s*:\s*R?\$\s*([0-9.,]+)/i, 1);
    addNumericField('total_descontos', /(?:➡️\s*)?Total de Descontos\s*:\s*R?\$\s*([0-9.,]+)/i, 1);
    addNumericField('valor_liquido', /Valor Líquido\s*:\s*R?\$\s*([0-9.,]+)/i, 1);

    // --- Generic patterns as fallbacks ---
    addField('empresa', /(empresa|razão social)\s*[:\s-]*\s*([^\n\r]+)/i, 2);
    addField('cnpj_empresa', /(cnpj|c\.n\.p\.j\.)\s*[:\s-]*\s*([0-9\.\/-]+)/i, 2, formatCnpj);
    addField('colaborador', /(colaborador|empregado|funcion.rio|nome)\s*[:\s-]*\s*([^\n\r]+)/i, 2);
    addField('cpf_colaborador', /(cpf|c\.p\.f\.)\s*[:\s-]*\s*([0-9\.\/-]+)/i, 2, formatCpf);
    addField('matricula', /matr.cula\s*[:\s-]*\s*([\w.-]+)/i, 1);
    addField('cargo', /(cargo|função)\s*[:\s-]*\s*([^\n\r]+)/i, 2);
    addField('departamento', /(departamento|setor|seção)\s*[:\s-]*\s*([^\n\r]+)/i, 2);
    addField('data_pagamento', /(data\s*de\s*pagamento|pago\s*em)\s*[:\s-]*\s*([0-9\/]+)/i, 2, normalizeDate);
    addNumericField('total_proventos', /(total\s*de\s*proventos|total\s*vencimentos|total\s*cr.ditos)\s*[:\s-]*\s*([0-9.,\sR$]+)/i, 2);
    addNumericField('total_descontos', /(total\s*de\s*descontos|total\s*d.bitos)\s*[:\s-]*\s*([0-9.,\sR$]+)/i, 2);
    addNumericField('valor_liquido', /(l.quido\s*a\s*receber|valor\s*l.quido)\s*[:\s-]*\s*([0-9.,\sR$]+)/i, 2);
    addNumericField('base_inss', /base\s+c.lc\.\s*inss\s*[:\s-]*\s*([0-9.,\sR$]+)/i, 1);
    addNumericField('base_fgts', /base\s+c.lc\.\s*fgts\s*[:\s-]*\s*([0-9.,\sR$]+)/i, 1);
    addNumericField('base_irrf', /base\s+c.lc\.\s*irrf\s*[:\s-]*\s*([0-9.,\sR$]+)/i, 1);
    addNumericField('fgts_mes', /fgts\s+(?:do|no)\s+m.s\s*[:\s-]*\s*([0-9.,\sR$]+)/i, 1);

    const mesMatches = Array.from(text.matchAll(/(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*(?:[\/de\s]*)?\s*(\d{4})/gi));
    if (mesMatches.length > 0) {
      const mesCandidates = mesMatches.map(m => {
          const monthNum = monthNameToNumber(m[1]);
          return monthNum ? `${m[2]}-${monthNum}` : '';
      }).filter(Boolean);
      const competenciaCandidates = mesMatches.map(m => `${m[1]} de ${m[2]}`);
      candidates['mes'] = Array.from(new Set(mesCandidates));
      candidates['competencia'] = Array.from(new Set(competenciaCandidates));
      extracted.mes = candidates.mes[0] || '';
      extracted.competencia = candidates.competencia[0] || '';
    }

    const rubricas = parseRubricas(text);
    extracted.rubricas_json = JSON.stringify(rubricas, null, 2);

    // --- Fallbacks for totals and other calculated fields ---
    if (!extracted.total_proventos || extracted.total_proventos === '0') {
      const proventos = rubricas.reduce((s,r)=> s + (r.valor_provento||0),0);
      extracted.total_proventos = String(proventos);
    }
    if (!extracted.valor_bruto || extracted.valor_bruto === '0') {
      extracted.valor_bruto = extracted.total_proventos;
    }
    if (!extracted.total_descontos || extracted.total_descontos === '0') {
      const descontos = rubricas.reduce((s,r)=> s + (r.valor_desconto||0),0);
      extracted.total_descontos = String(descontos);
    }
    if (!extracted.valor_liquido || extracted.valor_liquido === '0') {
       const proventos = parseFloat(extracted.total_proventos || '0');
       const descontos = parseFloat(extracted.total_descontos || '0');
       extracted.valor_liquido = String(Math.max(proventos - descontos, 0));
    }

    // Fallback for salario_base from rubricas if not found in summary
    if (!extracted.salario_base || extracted.salario_base === '0') {
        extracted.salario_base = String(findValue(rubricas, /sal.rio base|sal.rio normal|dias normais/i));
    }

    extracted.comissao = String(sumValues(rubricas, /comiss/i));

    extracted.user_email = options.userEmail || '';
    extracted.fonte_arquivo = options.fonte;
    const id = generateId(extracted.empresa || '', extracted.cnpj_empresa || '', extracted.colaborador || '', extracted.mes || '', options.fonte);
    extracted.id_holerite = id;
    if (!extracted.holerite_id) {
        extracted.holerite_id = id;
    }

    const statusOk = extracted.empresa && extracted.cnpj_empresa && extracted.colaborador && extracted.mes && parseFloat(extracted.valor_liquido || '0') > 0;
    extracted.status_validacao = statusOk ? 'ok' : 'pendente';

    return { extracted, candidates };
}

import { extractTextFromPdfBuffer } from './holeriteParser';

export type Rubrica = {
  codigo?: string | null;
  descricao: string | null;
  quantidade?: string | null;
  valor_provento?: string | null;
  valor_desconto?: string | null;
};

export type HoleriteOut = {
  nome_funcionario: string | null;
  cargo: string | null;
  periodo: string | null;
  mes: string | null;
  total_vencimentos: string | null;
  total_descontos: string | null;
  valor_liquido: string | null;
  detalhes: Rubrica[];
};

const MONTHS: Record<string, string> = {
  janeiro: '01',
  fevereiro: '02',
  'março': '03',
  marco: '03',
  abril: '04',
  maio: '05',
  junho: '06',
  julho: '07',
  agosto: '08',
  setembro: '09',
  outubro: '10',
  novembro: '11',
  dezembro: '12',
};

function monthNameToISO(m: string, y: string): string {
  const num = MONTHS[m.toLowerCase()];
  return num ? `${y}-${num}` : '';
}

function normalize(t: string): string {
  return t.replace(/[ \t]+/g, ' ').replace(/\r/g, '').trim();
}

function findRegex(text: string, regex: RegExp): string | null {
  const m = text.match(regex);
  return m ? m[1]?.trim() || m[2]?.trim() || null : null;
}

function parseHeader(text: string): Pick<HoleriteOut, 'nome_funcionario'|'cargo'|'periodo'|'mes'> {
  const out = { nome_funcionario: null, cargo: null, periodo: null, mes: null };
  const nome = findRegex(text, /(nome\s+do\s+funcion[aá]rio|funcion[aá]rio|colaborador|empregado)[:\s-]*([A-ZÁ-Ú ][A-ZÁ-Ú ]{2,})/i);
  if (nome) out.nome_funcionario = nome;
  const cargo = findRegex(text, /\b(cargo|cbo)[:\s-]*([^\n]+)/i);
  if (cargo) out.cargo = cargo;
  const periodo = text.match(/(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(20\d{2})/i);
  if (periodo) {
    out.periodo = `${periodo[1]} de ${periodo[2]}`;
    out.mes = monthNameToISO(periodo[1], periodo[2]);
  }
  return out;
}

function parseTotals(text: string): Pick<HoleriteOut, 'total_vencimentos'|'total_descontos'|'valor_liquido'> {
  const out = { total_vencimentos: null, total_descontos: null, valor_liquido: null };
  const venc = text.match(/total\s+de\s+(vencimentos|proventos)[:\s-]*([\d\.\s]*,\d{2})/i);
  if (venc) out.total_vencimentos = venc[2].trim();
  const desc = text.match(/total\s+de\s+descontos?[:\s-]*([\d\.\s]*,\d{2})/i);
  if (desc) out.total_descontos = desc[1].trim();
  const liquido = text.match(/(valor\s+l[ií]quido|l[ií]quido(?:\s+a\s+receber)?)[:\s-]*([\d\.\s]*,\d{2})/i);
  if (liquido) out.valor_liquido = liquido[2].trim();
  return out;
}

function parseRubricasTable(text: string): Rubrica[] {
  const lines = text.split('\n');
  let headerIdx = -1;
  for (let i=0;i<lines.length;i++) {
    const l = lines[i].toLowerCase();
    if (/c[óo]d/.test(l) && /(descri[cç][aã]o|evento)/.test(l) && /(venc|provent)/.test(l)) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) return [];
  const header = lines[headerIdx].trim().split(/\s{2,}/);
  const mapping: Record<string, number> = {};
  header.forEach((h, idx) => {
    const hl = h.toLowerCase();
    if (/^c[óo]d/.test(hl) || /^cod$/.test(hl)) mapping.codigo = idx;
    else if (/descri[cç][aã]o|evento/.test(hl)) mapping.descricao = idx;
    else if (/refer|qtd|qtde/.test(hl)) mapping.quantidade = idx;
    else if (/venc|provent/.test(hl)) mapping.valor_provento = idx;
    else if (/descont/.test(hl)) mapping.valor_desconto = idx;
  });
  const out: Rubrica[] = [];
  for (let i=headerIdx+1;i<lines.length;i++) {
    const line = lines[i];
    if (/^\s*total/i.test(line)) break;
    const parts = line.trim().split(/\s{2,}/);
    if (parts.length < 2) continue;
    const desc = parts[mapping.descricao] || '';
    if (!desc || /^[-]+$/.test(desc)) continue;
    const rub: Rubrica = {
      codigo: mapping.codigo !== undefined ? (parts[mapping.codigo] || null) : null,
      descricao: desc || null,
      quantidade: mapping.quantidade !== undefined ? (parts[mapping.quantidade] || null) : null,
      valor_provento: mapping.valor_provento !== undefined ? (parts[mapping.valor_provento] || null) : null,
      valor_desconto: mapping.valor_desconto !== undefined ? (parts[mapping.valor_desconto] || null) : null,
    };
    out.push(rub);
  }
  return out;
}

export async function extractHolerite(buffer: Buffer): Promise<HoleriteOut> {
  const raw = await extractTextFromPdfBuffer(buffer);
  const text = normalize(raw);
  const header = parseHeader(text);
  const totals = parseTotals(text);
  const detalhes = parseRubricasTable(text);
  return {
    nome_funcionario: header.nome_funcionario,
    cargo: header.cargo,
    periodo: header.periodo,
    mes: header.mes,
    total_vencimentos: totals.total_vencimentos,
    total_descontos: totals.total_descontos,
    valor_liquido: totals.valor_liquido,
    detalhes,
  };
}


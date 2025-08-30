import fs from 'fs';
import pdfParse from 'pdf-parse';
import { spawnSync } from 'child_process';

function toBRNumber(s: string | null | undefined): number | null {
  if (!s) return null;
  const n = s.replace(/\./g, '').replace(',', '.');
  const num = Number(n);
  return Number.isFinite(num) ? num : null;
}

function clean(s: string): string {
  return s
    .replace(/\u00A0/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

const stripAccentsUpper = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

function uniqLinesPreservingOrder(lines: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ln of lines) {
    const key = ln.trim();
    if (!seen.has(key) && key) {
      seen.add(key);
      out.push(ln);
    }
  }
  return out;
}

const LABELS = [
  'VALOR LIQUIDO',
  'TOTAL DE VENCIMENTOS',
  'TOTAL DE DESCONTOS',
  'BASE CALC. FGTS',
  'F.G.T.S DO MES',
  'BASE CALC. IRRF',
  'FAIXA IRRF',
  'SAL. CONTR. INSS',
  'SALARIO BASE',
];

const ITEMS = [
  'DIAS NORMAIS',
  'DIFERENCA DE SALARIOS CCT',
  'TROCO DO MES',
  'COMISSAO',
  'DSR S/ COMISSAO',
  'IMPOSTO DE RENDA',
  'TROCO MES ANTERIOR',
  'DESC ADIANTAMENTO DE SALARIO',
  'INSS',
];

function findAmountAfter(lines: string[], label: string): number | null {
  const L = stripAccentsUpper(label);
  for (let i = 0; i < lines.length; i++) {
    const U = stripAccentsUpper(lines[i]);
    if (U.includes(L)) {
      for (let j = i; j <= i + 3 && j < lines.length; j++) {
        const m = lines[j].match(/(\d{1,3}(\.\d{3})*,\d{2})/);
        if (m) return toBRNumber(m[1]);
      }
    }
  }
  return null;
}

function findItem(lines: string[], itemLabel: string) {
  const L = stripAccentsUpper(itemLabel);
  for (let i = 0; i < lines.length; i++) {
    const U = stripAccentsUpper(lines[i]);
    if (U.includes(L)) {
      let values: number[] = [];
      for (let j = i; j <= i + 3 && j < lines.length; j++) {
        const matches = lines[j].match(/(\d{1,3}(?:\.\d{3})*,\d{2})/g) || [];
        const found = matches.map((m) => toBRNumber(m) as number);
        values.push(...found);
      }
      if (values.length >= 2)
        return { vencimentos: values[0], descontos: values[1] };
      if (values.length === 1) return { valor: values[0] };
      return null;
    }
  }
  return null;
}

function dedupeVoucher(lines: string[]): string[] {
  const idxs: number[] = [];
  lines.forEach((ln, idx) => {
    const U = stripAccentsUpper(ln);
    if (U.includes('DECLARO TER RECEBIDO')) idxs.push(idx);
  });
  if (idxs.length >= 2) {
    const end = idxs[0] + 1;
    return lines.slice(0, end);
  }
  const hits: number[] = [];
  lines.forEach((ln, idx) => {
    if (stripAccentsUpper(ln).includes('CNPJ')) hits.push(idx);
  });
  if (hits.length >= 2) {
    return lines.slice(0, hits[1]);
  }
  return lines;
}

async function ocrPdfToText(pdfPath: string): Promise<string> {
  const out = spawnSync('pdftoppm', ['-png', '-singlefile', pdfPath, '/tmp/page']);
  if (out.status !== 0) {
    throw new Error('Falha ao converter PDF para imagem. Instale poppler-utils.');
  }
  const { createWorker } = await import('tesseract.js');
  const worker: any = await createWorker();
  await worker.loadLanguage('por');
  await worker.initialize('por');
  const {
    data: { text },
  } = await worker.recognize('/tmp/page.png');
  await worker.terminate();
  return text;
}

export interface HoleriteExtraction {
  empresa: string | null;
  cnpj: string | null;
  colaborador: string | null;
  periodo: string | null;
  cargo: string | null;
  totals: Record<string, number>;
  itens: Record<string, any>;
  debug: { lineCount: number };
}

export async function extractFromPdf(pdfPath: string): Promise<HoleriteExtraction> {
  const buf = fs.readFileSync(pdfPath);
  const data = await pdfParse(buf);
  let text = clean(data.text || '');

  if (text.length < 50) {
    console.warn('PDF parece ser imagem. Tentando OCR...');
    text = clean(await ocrPdfToText(pdfPath));
  }

  let lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  lines = uniqLinesPreservingOrder(lines);
  lines = dedupeVoucher(lines);

  const out: HoleriteExtraction = {
    empresa: null,
    cnpj: null,
    colaborador: null,
    periodo: null,
    cargo: null,
    totals: {},
    itens: {},
    debug: { lineCount: lines.length },
  };

  const iEmp = lines.findIndex((l) => stripAccentsUpper(l).includes('LEVERPRO'));
  if (iEmp >= 0) out.empresa = lines[iEmp];

  const cnpjMatch = text.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b|\b\d{14}\b/);
  if (cnpjMatch) out.cnpj = cnpjMatch[0];

  const nomeIdx = lines.findIndex((l) =>
    stripAccentsUpper(l).includes('NOME DO FUNCIONARIO')
  );
  if (nomeIdx >= 0 && lines[nomeIdx + 1]) {
    out.colaborador = lines[nomeIdx + 1];
  } else {
    const guess = lines.find((l) => /FRANCISCO/i.test(l) && /QUEIROZ/i.test(l));
    if (guess) out.colaborador = guess;
  }

  const mesAno = lines.find((l) => /\b(de|\/)\s*20\d{2}\b/i.test(l));
  const folhaIdx = lines.findIndex((l) => stripAccentsUpper(l).includes('FOLHA MENSAL'));
  if (folhaIdx >= 0 && lines[folhaIdx + 1]) out.periodo = lines[folhaIdx + 1];
  else if (mesAno) out.periodo = mesAno;

  for (const L of LABELS) {
    const val = findAmountAfter(lines, L);
    if (val !== null) out.totals[L] = val;
  }

  for (const it of ITEMS) {
    const found = findItem(lines, it);
    if (found) out.itens[it] = found;
  }

  return out;
}


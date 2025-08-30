// extract.js
import fs from "fs";
import pdfParse from "pdf-parse";
import { remove as removeDiacritics } from "diacritics";
import { spawnSync } from "child_process";

// --------- Helpers ---------
const toBRNumber = (s) => {
  // Converte "14.142,84" => 14142.84
  if (!s) return null;
  const n = s.replace(/\./g, "").replace(",", ".");
  const num = Number(n);
  return Number.isFinite(num) ? num : null;
};

const clean = (s) =>
  s
    .replace(/\u00A0/g, " ")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

const stripAccentsUpper = (s) => removeDiacritics(s).toUpperCase();

const uniqLinesPreservingOrder = (lines) => {
  const seen = new Set();
  const out = [];
  for (const ln of lines) {
    const key = ln.trim();
    if (!seen.has(key) && key) {
      seen.add(key);
      out.push(ln);
    }
  }
  return out;
};

// Algumas chaves que costumam aparecer no holerite
const LABELS = [
  "VALOR LIQUIDO",
  "TOTAL DE VENCIMENTOS",
  "TOTAL DE DESCONTOS",
  "BASE CALC. FGTS",
  "F.G.T.S DO MES",
  "BASE CALC. IRRF",
  "FAIXA IRRF",
  "SAL. CONTR. INSS",
  "SALARIO BASE",
];

// Itens de proventos/descontos que queremos mapear com regex tolerante
const ITEMS = [
  "DIAS NORMAIS",
  "DIFERENCA DE SALARIOS CCT",
  "TROCO DO MES",
  "COMISSAO",
  "DSR S/ COMISSAO",
  "IMPOSTO DE RENDA",
  "TROCO MES ANTERIOR",
  "DESC ADIANTAMENTO DE SALARIO",
  "INSS",
];

// Procura o primeiro número monetário após um rótulo
function findAmountAfter(lines, label) {
  const L = stripAccentsUpper(label);
  for (let i = 0; i < lines.length; i++) {
    const U = stripAccentsUpper(lines[i]);
    if (U.includes(L)) {
      // Procura na própria linha e nas próximas 3 linhas
      for (let j = i; j <= i + 3 && j < lines.length; j++) {
        const m = lines[j].match(/(\d{1,3}(\.\d{3})*,\d{2})/);
        if (m) return toBRNumber(m[1]);
      }
    }
  }
  return null;
}

// Procura por item (provento/desconto) e captura UM (ou dois) valores próximos
function findItem(lines, itemLabel) {
  const L = stripAccentsUpper(itemLabel);
  for (let i = 0; i < lines.length; i++) {
    const U = stripAccentsUpper(lines[i]);
    if (U.includes(L)) {
      // Varre as próximas linhas em busca de valores (pode haver Vencimentos e/ou Descontos)
      let values = [];
      for (let j = i; j <= i + 3 && j < lines.length; j++) {
        const found = [...lines[j].matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})/g)].map((m) =>
          toBRNumber(m[1])
        );
        values.push(...found);
      }
      // Heurística: se encontrarmos 2 valores seguidos, assume [vencimentos, descontos]
      if (values.length >= 2) return { vencimentos: values[0], descontos: values[1] };
      if (values.length === 1) return { valor: values[0] };
      return null;
    }
  }
  return null;
}

// Heurística para remover a duplicidade de "vias" (quando o holerite vem duas vezes na mesma página)
function dedupeVoucher(lines) {
  // Muitos holerites duplicam da linha "LEVERPRO ..." em diante.
  // Estratégia: corta o texto no segundo "Declaro ter recebido..." (ou no segundo CNPJ/Nome) e mantém a primeira metade.
  const idxs = [];
  lines.forEach((ln, idx) => {
    const U = stripAccentsUpper(ln);
    if (U.includes("DECLARO TER RECEBIDO")) idxs.push(idx);
  });
  if (idxs.length >= 2) {
    const end = idxs[0] + 1; // mantém até o primeiro "Declaro ter recebido"
    return lines.slice(0, end);
  }

  // fallback: se repetiu “CNPJ”/empresa duas vezes, pega só até a metade
  const hits = [];
  lines.forEach((ln, idx) => {
    if (stripAccentsUpper(ln).includes("CNPJ")) hits.push(idx);
  });
  if (hits.length >= 2) {
    return lines.slice(0, hits[1]); // antes do segundo bloco
  }
  return lines;
}

// --------- OCR fallback (opcional) ---------
async function ocrPdfToText(pdfPath) {
  // Requer poppler instalado. Converte a primeira página pra PNG.
  const out = spawnSync("pdftoppm", ["-png", "-singlefile", pdfPath, "/tmp/page"]);
  if (out.status !== 0) {
    throw new Error("Falha ao converter PDF para imagem. Instale poppler-utils.");
  }
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker();
  await worker.loadLanguage("por");
  await worker.initialize("por");
  const {
    data: { text },
  } = await worker.recognize("/tmp/page.png");
  await worker.terminate();
  return text;
}

// --------- Pipeline principal ---------
async function extractFromPdf(pdfPath) {
  const buf = fs.readFileSync(pdfPath);

  // 1) Tenta extrair texto com pdf-parse
  const data = await pdfParse(buf);
  let text = clean(data.text || "");

  if (text.length < 50) {
    // 2) Fallback para OCR se praticamente não há texto
    console.warn("PDF parece ser imagem. Tentando OCR...");
    text = clean(await ocrPdfToText(pdfPath));
  }

  // Quebra em linhas e normaliza/deduplica
  let lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  lines = uniqLinesPreservingOrder(lines);
  lines = dedupeVoucher(lines);

  // Campos-chave
  const out = {
    empresa: null,
    cnpj: null,
    colaborador: null,
    periodo: null,
    cargo: null,
    totals: {},
    itens: {},
    debug: { lineCount: lines.length },
  };

  // Empresa
  const iEmp = lines.findIndex((l) => stripAccentsUpper(l).includes("LEVERPRO"));
  if (iEmp >= 0) out.empresa = lines[iEmp];

  // CNPJ (primeira ocorrência)
  const cnpjMatch = text.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b|\b\d{14}\b/);
  if (cnpjMatch) out.cnpj = cnpjMatch[0];

  // Colaborador
  const nomeIdx = lines.findIndex((l) =>
    stripAccentsUpper(l).includes("NOME DO FUNCIONARIO")
  );
  if (nomeIdx >= 0 && lines[nomeIdx + 1]) {
    out.colaborador = lines[nomeIdx + 1];
  } else {
    // fallback: procura linha que tenha “FRANCISCO” etc. (ajuste conforme necessário)
    const guess = lines.find((l) => /FRANCISCO/i.test(l) && /QUEIROZ/i.test(l));
    if (guess) out.colaborador = guess;
  }

  // Período (ex.: "Folha Mensal" e "Outubro de 2022")
  const mesAno = lines.find((l) => /\b(de|\/)\s*20\d{2}\b/i.test(l));
  const folhaIdx = lines.findIndex((l) => stripAccentsUpper(l).includes("FOLHA MENSAL"));
  if (folhaIdx >= 0 && lines[folhaIdx + 1]) out.periodo = lines[folhaIdx + 1];
  else if (mesAno) out.periodo = mesAno;

  // Totais (busca tolerante)
  for (const L of LABELS) {
    const val = findAmountAfter(lines, L);
    if (val !== null) out.totals[L] = val;
  }

  // Itens (proventos/descontos mais comuns)
  for (const it of ITEMS) {
    const found = findItem(lines, it);
    if (found) out.itens[it] = found;
  }

  return out;
}

// --------- Run (CLI) ---------
const pdfPath = process.argv[2] || "./2022-11 05 - RECIBO_PGTO_MENSAL_FRANCISCO.10-2022.pdf";
extractFromPdf(pdfPath)
  .then((res) => {
    console.log(JSON.stringify(res, null, 2));
  })
  .catch((err) => {
    console.error("Erro na extração:", err);
    process.exit(1);
  });


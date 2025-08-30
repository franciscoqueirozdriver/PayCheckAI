// lib/holeriteExtract.ts
// Parser de holerites baseado apenas em texto de PDF
// pdf-parse é carregado dinamicamente para evitar dependências em build
let pdfParse: any;

// =========================
// Tipos de saída
// =========================

export type Rubrica = {
  codigo?: string | null;
  descricao: string | null;
  quantidade?: string | null;
  valor_provento?: string | null;
  valor_desconto?: string | null;
};

export type HoleriteOut = {
  empresa: string | null;
  cnpj_empresa: string | null;
  nome_funcionario: string | null;
  cpf_colaborador: string | null;
  cargo: string | null;
  cbo: string | null;
  departamento: string | null;
  admissao: string | null;              // dd/mm/aaaa
  periodo: string | null;               // “Setembro de 2022”
  mes: string | null;                   // YYYY-MM
  salario_base: string | null;
  total_vencimentos: string | null;
  total_descontos: string | null;
  valor_liquido: string | null;
  base_inss: string | null;
  base_fgts: string | null;
  base_irrf: string | null;
  fgts_mes: string | null;
  comissao: string | null;
  dsr: string | null;
  dias_dsr: string | null;
  ferias: { dias: string | null; valor: string | null };
  adiantamentos: string | null;
  pensao: string | null;
  abonos: string | null;
  medias_variaveis: string | null;
  rubricas_json: string;                // JSON.stringify(Rubrica[])
};

// =========================
// Utilidades
// =========================

const PT_MONTHS: Record<string, string> = {
  janeiro: "01", fevereiro: "02", "março": "03", "marco": "03", abril: "04", maio: "05",
  junho: "06", julho: "07", agosto: "08", setembro: "09", outubro: "10", novembro: "11", dezembro: "12",
};

const re = {
  cnpj: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g,
  cpf: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
  moneyBR: /\b\d{1,3}(\.\d{3})*,\d{2}\b/g,
  dateBR: /\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/g,
  mesTexto: new RegExp(`\\b(${Object.keys(PT_MONTHS).join("|")})\\s+de\\s+(20\\d{2})\\b`, "i"),
};

function normText(s: string) {
  return s.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\u00A0/g, " ").trim();
}

function toFloatBR(s?: string | null): number | null {
  if (!s) return null;
  const v = s.replace(/\./g, "").replace(",", ".");
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toMoneyBR(n: number | null): string | null {
  if (n == null || !Number.isFinite(n)) return null;
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function monthTextToISO(m: string, y: string) {
  const key = m.toLowerCase();
  const mm = PT_MONTHS[key];
  return mm ? `${y}-${mm}` : null;
}

// Pega próximo valor monetário após um rótulo (tolerando quebras)
function findMoneyAfter(labelRegex: RegExp, text: string): string | null {
  const idx = text.search(labelRegex);
  if (idx < 0) return null;
  const sub = text.slice(idx);
  const m = sub.match(re.moneyBR);
  return m?.[0] ?? null;
}

// =========================
// Extração por TEXTO (pdf-parse)
// =========================

function parseByText(textRaw: string): Partial<HoleriteOut> & { detalhes?: Rubrica[] } {
  const text = normText(textRaw);

  // Empresa: linha anterior ao CNPJ em caixa alta
  let empresa: string | null = null;
  let cnpj_empresa: string | null = null;
  const mCnpj = text.match(re.cnpj);
  if (mCnpj && mCnpj.length) {
    cnpj_empresa = mCnpj[0];
    const parts = textRaw.split("\n");
    for (let i = 0; i < parts.length; i++) {
      if (re.cnpj.test(parts[i])) {
        for (let j = i - 1; j >= 0; j--) {
          const t = parts[j].trim();
          if (t) {
            const cand = t.replace(/\s+/g, " ").trim();
            if (/[A-ZÁ-Ú0-9]/.test(cand) && cand === cand.toUpperCase() && cand.length >= 6) {
              empresa = cand;
            }
            break;
          }
        }
        break;
      }
    }
    re.cnpj.lastIndex = 0;
  }

  // Nome / CPF
  const cpfCol = (text.match(re.cpf) || [])[0] ?? null;
  let nome: string | null = null;
  const lines = textRaw.split("\n");
  const labelIdx = lines.findIndex((ln) => /nome\s+do\s+funcion(á|a)rio|funcion(á|a)rio|colaborador|empregado/i.test(ln));
  if (labelIdx >= 0) {
    const cand = normText(lines[labelIdx].replace(/.*?:/, "").trim()) || normText(lines[labelIdx + 1] || "");
    nome = cand || null;
  } else {
    const hi = lines.find((ln) => /[A-ZÁ-Ú]{3,}\s+[A-ZÁ-Ú]{3,}/.test(ln) && ln === ln.toUpperCase());
    nome = (hi && normText(hi)) || null;
  }

  // Cargo / CBO / Departamento
  function findAfter(label: RegExp): string | null {
    const i = lines.findIndex((ln) => label.test(ln));
    if (i >= 0) {
      const tail = normText(lines[i].replace(/.*?:/, ""));
      if (tail) return tail;
      return normText(lines[i + 1] || "") || null;
    }
    return null;
  }
  const cargo = findAfter(/\b(cargo|função)\b/i);
  const cbo = findAfter(/\bCBO\b/i);
  const departamento = findAfter(/\b(depto|departamento)\b/i);
  const admissao = (text.match(re.dateBR) || [])[0] ?? null;

  // Período/Mês
  let periodo: string | null = null;
  let mes: string | null = null;
  const mPeriodo = text.match(re.mesTexto);
  if (mPeriodo) {
    periodo = `${mPeriodo[1]} de ${mPeriodo[2]}`;
    mes = monthTextToISO(mPeriodo[1], mPeriodo[2]);
  }

  // Totais e líquido
  const total_vencimentos =
    findMoneyAfter(/total\s+de\s+(vencimentos|proventos)/i, text) ||
    findMoneyAfter(/total\s+vencimentos|total\s+proventos/i, text) ||
    null;

  const total_descontos =
    findMoneyAfter(/total\s+de\s+descontos?/i, text) ||
    findMoneyAfter(/total\s+descontos?/i, text) ||
    null;

  const valor_liquido =
    findMoneyAfter(/valor\s+l[ií]quido(\s+a\s+receber)?/i, text) ||
    findMoneyAfter(/\bl[ií]quido\b/i, text) ||
    null;

  // Bases
  const base_inss = findMoneyAfter(/base(\s+de)?\s+(c[áa]lculo\s+)?inss/i, text) || null;
  const base_fgts = findMoneyAfter(/base(\s+de)?\s+(c[áa]lculo\s+)?fgts/i, text) || null;
  const base_irrf = findMoneyAfter(/base(\s+de)?\s+(c[áa]lculo\s+)?irrf/i, text) || null;
  const fgts_mes = findMoneyAfter(/fgts\s*(do)?\s*m[eê]s/i, text) || null;

  // Tabela de rubricas
  const detalhes = parseRubricasHeuristica(textRaw);

  // Derivados
  const salario_base = detalhes.find((r) => r.descricao && /sal[áa]rio\s*base/i.test(r.descricao))?.valor_provento || null;
  const comissaoSum = sumRubricas(detalhes, /comiss(ão|ao|oes|ões)?/i);
  const dsrSum = sumRubricas(detalhes, /\bdsr\b|descanso\s+semanal/i);
  const dias_dsr = detalhes.find((r) => r.descricao && /\bdsr\b/i.test(r.descricao))?.quantidade || null;

  const feriasRub = detalhes.find((r) => r.descricao && /f[eé]rias/i.test(r.descricao));
  const ferias = {
    dias: feriasRub?.quantidade || null,
    valor: feriasRub?.valor_provento || feriasRub?.valor_desconto || null,
  };
  const adiantamentos = sumRubricas(detalhes, /adiant/i);
  const pensao = sumRubricas(detalhes, /pens[aã]o/i);
  const abonos = sumRubricas(detalhes, /abono/i);
  const medias_variaveis = sumRubricas(detalhes, /m[eé]dia/i);

  return {
    empresa: empresa || null,
    cnpj_empresa: cnpj_empresa || null,
    nome_funcionario: nome || null,
    cpf_colaborador: cpfCol,
    cargo: cargo || null,
    cbo: cbo || null,
    departamento: departamento || null,
    admissao,
    periodo,
    mes,
    salario_base,
    total_vencimentos,
    total_descontos,
    valor_liquido,
    base_inss,
    base_fgts,
    base_irrf,
    fgts_mes,
    comissao: comissaoSum,
    dsr: dsrSum,
    dias_dsr,
    ferias,
    adiantamentos,
    pensao,
    abonos,
    medias_variaveis,
    detalhes,
  };
}

function parseRubricasHeuristica(textRaw: string): Rubrica[] {
  const lines = textRaw.split("\n").map((l) => l.replace(/\r/g, "").trim()).filter(Boolean);
  const headIdx = lines.findIndex((l) =>
    /(c[óo]d(\.|igo)?).*(descri(c|ç)[aã]o|evento).*(refer|qtd|qtde).*(venc|proventos).*(descont)/i.test(l)
  );
  if (headIdx < 0) return [];
  const dataLines = lines.slice(headIdx + 1);

  const rows: Rubrica[] = [];
  for (const ln of dataLines) {
    if (/^\s*total\b/i.test(ln) || /a\s+transportar/i.test(ln)) continue;
    const cols = ln.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
    if (cols.length < 2) continue;

    let codigo: string | null = null;
    let descricao: string | null = null;
    let quantidade: string | null = null;
    let valor_provento: string | null = null;
    let valor_desconto: string | null = null;

    if (/^\d{2,5}$/.test(cols[0])) {
      codigo = cols[0];
      descricao = cols[1] ?? null;
      quantidade = cols[2] ?? null;
      const moneys = cols.filter((c) => re.moneyBR.test(c));
      if (moneys.length >= 2) {
        valor_provento = moneys[moneys.length - 2];
        valor_desconto = moneys[moneys.length - 1];
      } else if (moneys.length === 1) {
        valor_provento = moneys[0];
      }
    } else {
      descricao = cols[0];
      quantidade = cols[1] ?? null;
      const moneys = cols.filter((c) => re.moneyBR.test(c));
      if (moneys.length >= 2) {
        valor_provento = moneys[moneys.length - 2];
        valor_desconto = moneys[moneys.length - 1];
      } else if (moneys.length === 1) {
        valor_provento = moneys[0];
      }
    }

    rows.push({ codigo, descricao, quantidade, valor_provento, valor_desconto });
  }
  return rows;
}

function sumRubricas(rows: Rubrica[], descRegex: RegExp): string | null {
  let total = 0;
  let found = false;
  for (const r of rows) {
    if (r.descricao && descRegex.test(r.descricao)) {
      const vp = toFloatBR(r.valor_provento || "");
      const vd = toFloatBR(r.valor_desconto || "");
      if (vp) { total += vp; found = true; }
      if (vd) { total -= vd; found = true; }
    }
  }
  return found ? toMoneyBR(total) : null;
}

// =========================
// Função principal
// =========================

export async function extractHolerite(buffer: Buffer): Promise<HoleriteOut> {
  try {
    if (!pdfParse) {
      pdfParse = (await import("pdf-parse")).default;
    }
    const parsed = await pdfParse(buffer);
    const t = parseByText(parsed.text || "");
    return finalize(t);
  } catch {
    return finalize({});
  }
}

function finalize(t: Partial<HoleriteOut> & { detalhes?: Rubrica[] }): HoleriteOut {
  const detalhes = t.detalhes || [];
  let total_vencimentos = t.total_vencimentos ?? null;
  let total_descontos = t.total_descontos ?? null;
  let valor_liquido = t.valor_liquido ?? null;

  if ((!total_vencimentos || !total_descontos || !valor_liquido) && detalhes.length) {
    const sumP = detalhes.reduce((acc, r) => acc + (toFloatBR(r.valor_provento) || 0), 0);
    const sumD = detalhes.reduce((acc, r) => acc + (toFloatBR(r.valor_desconto) || 0), 0);
    total_vencimentos = total_vencimentos || toMoneyBR(sumP);
    total_descontos = total_descontos || toMoneyBR(sumD);
    valor_liquido = valor_liquido || toMoneyBR(sumP - sumD);
  }

  return {
    empresa: t.empresa ?? null,
    cnpj_empresa: t.cnpj_empresa ?? null,
    nome_funcionario: t.nome_funcionario ?? null,
    cpf_colaborador: t.cpf_colaborador ?? null,
    cargo: t.cargo ?? null,
    cbo: t.cbo ?? null,
    departamento: t.departamento ?? null,
    admissao: t.admissao ?? null,
    periodo: t.periodo ?? null,
    mes: t.mes ?? null,
    salario_base: t.salario_base ?? null,
    total_vencimentos,
    total_descontos,
    valor_liquido,
    base_inss: t.base_inss ?? null,
    base_fgts: t.base_fgts ?? null,
    base_irrf: t.base_irrf ?? null,
    fgts_mes: t.fgts_mes ?? null,
    comissao: t.comissao ?? null,
    dsr: t.dsr ?? null,
    dias_dsr: t.dias_dsr ?? null,
    ferias: t.ferias ?? { dias: null, valor: null },
    adiantamentos: t.adiantamentos ?? null,
    pensao: t.pensao ?? null,
    abonos: t.abonos ?? null,
    medias_variaveis: t.medias_variaveis ?? null,
    rubricas_json: JSON.stringify(detalhes),
  };
}


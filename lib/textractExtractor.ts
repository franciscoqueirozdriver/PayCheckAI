import {
    TextractClient,
    AnalyzeDocumentCommand,
    FeatureType,
    StartDocumentAnalysisCommand,
    GetDocumentAnalysisCommand,
    JobStatus,
    Block,
    BlockType,
    RelationshipType
} from "@aws-sdk/client-textract";
import type { GetDocumentAnalysisCommandOutput } from "@aws-sdk/client-textract";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ocrWithTesseract, normalizeCurrency, normalizeDate, parseRubricas } from './holeriteParser';
import type { HoleriteDraft, CandidatesMap, RubricaEntry } from "@/models/holerite";
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
    const lowerName = name.toLowerCase().split(' ')[0];
    return map[lowerName] || null;
}

// --- Textract Response Parsers ---
const getText = (block: Block, blocksById: Map<string, Block>): string => {
    let text = '';
    if (block.Relationships) {
        for (const relationship of block.Relationships) {
            if (relationship.Type === RelationshipType.CHILD) {
                for (const childId of relationship.Ids!) {
                    const childBlock = blocksById.get(childId);
                    if (childBlock && childBlock.BlockType === BlockType.WORD) {
                        text += childBlock.Text + ' ';
                    }
                }
            }
        }
    }
    return text.trim();
};

const parseForms = (blocks: Block[], blocksById: Map<string, Block>): Map<string, string> => {
    const forms = new Map<string, string>();
    for (const block of blocks) {
        if (block.BlockType === BlockType.KEY_VALUE_SET && block.EntityTypes?.includes('KEY')) {
            const key = getText(block, blocksById).replace(/:/g, '').trim().toLowerCase();
            let value = '';
            if (block.Relationships) {
                for (const relationship of block.Relationships) {
                    if (relationship.Type === RelationshipType.VALUE) {
                        for (const valueId of relationship.Ids!) {
                            value += getText(blocksById.get(valueId)!, blocksById) + ' ';
                        }
                    }
                }
            }
            if (key) forms.set(key, value.trim());
        }
    }
    return forms;
};

const parseTables = (blocks: Block[], blocksById: Map<string, Block>): string[][][] => {
    const tables: string[][][] = [];
    const tableBlocks = blocks.filter(b => b.BlockType === BlockType.TABLE);
    for (const tableBlock of tableBlocks) {
        const table: string[][] = [];
        const rows: Map<number, any> = new Map();
        if (tableBlock.Relationships) {
            for (const rel of tableBlock.Relationships) {
                if (rel.Type === RelationshipType.CHILD) {
                    for (const cellId of rel.Ids!) {
                        const cell = blocksById.get(cellId)!;
                        if (cell.BlockType === BlockType.CELL) {
                            const rowIndex = cell.RowIndex! - 1;
                            const colIndex = cell.ColumnIndex! - 1;
                            if (!rows.has(rowIndex)) {
                                rows.set(rowIndex, {});
                            }
                            rows.get(rowIndex)[colIndex] = getText(cell, blocksById);
                        }
                    }
                }
            }
        }
        for (const [_, rowData] of Array.from(rows.entries()).sort((a,b) => a[0] - b[0])) {
            const row: string[] = [];
            const sortedCells = Object.entries(rowData).sort((a,b) => parseInt(a[0]) - parseInt(b[0]));
            for (const [_, cellText] of sortedCells) {
                row.push(cellText as string);
            }
            table.push(row);
        }
        tables.push(table);
    }
    return tables;
};

// --- Main Mapping Logic ---
function mapTextractResponse(response: GetDocumentAnalysisCommandOutput, filename: string): { extracted: HoleriteDraft, candidates: CandidatesMap } {
    const { Blocks } = response;
    if (!Blocks) return { extracted: {fonte_arquivo: filename, status_validacao: 'falha_textract'}, candidates: {} };

    const blocksById = new Map(Blocks.map(b => [b.Id!, b]));
    const forms = parseForms(Blocks, blocksById);
    const tables = parseTables(Blocks, blocksById);

    const extracted: HoleriteDraft = {};
    const candidates: CandidatesMap = {};

    const findFormValue = (aliases: string[], formatter?: (val: string) => string) => {
        for (const alias of aliases) {
            if (forms.has(alias)) {
                const value = forms.get(alias)!;
                return formatter ? formatter(value) : value;
            }
        }
        return undefined;
    };

    // Field mapping
    extracted.empresa = findFormValue(['empresa', 'razão social']);
    extracted.cnpj_empresa = findFormValue(['cnpj', 'c.n.p.j.'], (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5'));
    extracted.colaborador = findFormValue(['funcionário', 'empregado', 'colaborador', 'nome']);
    extracted.cpf_colaborador = findFormValue(['cpf', 'c.p.f.'], (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'));
    extracted.data_pagamento = findFormValue(['data de pagamento', 'pagamento', 'vencimento'], normalizeDate);

    const competencia = findFormValue(['competência', 'folha mensal', 'mês', 'mês de referência']);
    if (competencia) {
        extracted.competencia = competencia;
        const monthMatch = competencia.match(/(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*de\s*(\d{4})/i);
        if (monthMatch) {
            const monthNum = monthNameToNumber(monthMatch[1]);
            if (monthNum) extracted.mes = `${monthMatch[2]}-${monthNum}`;
        }
    }

    extracted.total_proventos = String(normalizeCurrency(findFormValue(['total vencimentos', 'total de vencimentos', 'total proventos'])));
    extracted.total_descontos = String(normalizeCurrency(findFormValue(['total descontos', 'total de descontos'])));
    extracted.valor_liquido = String(normalizeCurrency(findFormValue(['líquido a receber', 'liquido a receber', 'valor líquido', 'valor liquido'])));
    extracted.valor_bruto = extracted.total_proventos;
    extracted.base_inss = String(normalizeCurrency(findFormValue(['base inss', 'salário contribuição inss'])));
    extracted.base_fgts = String(normalizeCurrency(findFormValue(['base fgts', 'base cálculo fgts'])));
    extracted.base_irrf = String(normalizeCurrency(findFormValue(['base irrf', 'base cálculo irrf'])));
    extracted.fgts_mes = String(normalizeCurrency(findFormValue(['fgts mês', 'fgts do mês'])));

    // Rubricas from tables
    const rubricas: RubricaEntry[] = [];
    for (const table of tables) {
        const header = table[0]?.map(h => h.toLowerCase()) || [];
        const codIdx = header.findIndex(h => /c.d|codigo/i.test(h));
        const descIdx = header.findIndex(h => /desc|rubrica/i.test(h));
        const refIdx = header.findIndex(h => /ref|horas/i.test(h));
        const vencIdx = header.findIndex(h => /venc|proventos/i.test(h));
        const descContoIdx = header.findIndex(h => /descontos/i.test(h));

        if (descIdx > -1 && (vencIdx > -1 || descContoIdx > -1)) {
            for (let i = 1; i < table.length; i++) {
                const row = table[i];
                rubricas.push({
                    codigo: codIdx > -1 ? row[codIdx] : '',
                    descricao: row[descIdx],
                    quantidade: refIdx > -1 ? row[refIdx] : '',
                    valor_provento: vencIdx > -1 ? normalizeCurrency(row[vencIdx]) : 0,
                    valor_desconto: descContoIdx > -1 ? normalizeCurrency(row[descContoIdx]) : 0,
                });
            }
        }
    }
    extracted.rubricas_json = JSON.stringify(rubricas, null, 2);

    // Derived fields from rubricas
    const findInRubricas = (pattern: RegExp) => rubricas.filter(r => pattern.test(r.descricao.toLowerCase())).reduce((sum, r) => sum + (r.valor_provento || 0) - (r.valor_desconto || 0), 0);
    if (!extracted.salario_base || extracted.salario_base === '0') extracted.salario_base = String(findInRubricas(/sal(á|a)rio\s*base/i));
    extracted.comissao = String(findInRubricas(/comiss(ão|ao)?/i));
    const dsrVal = findInRubricas(/\bdsr\b|descanso semanal remunerado|rep\.?\s*rem/i);
    extracted.dsr = String(dsrVal);

    // Final status and ID
    extracted.fonte_arquivo = filename;
    const hasRequired = extracted.empresa && extracted.cnpj_empresa && extracted.colaborador && extracted.mes && extracted.valor_liquido;
    extracted.status_validacao = hasRequired ? 'ok' : 'pendente';
    extracted.id_holerite = generateId(extracted.empresa || '', extracted.cnpj_empresa || '', extracted.colaborador || '', extracted.mes || '', filename);

    return { extracted, candidates };
}

// --- Fallback text parser ---
function simpleRegexParser(text: string) {
    console.log("Running simple regex parser (fallback)...");
    // This should contain the robust regex logic from previous attempts
    // For now, returning a simple object.
    return {
        extracted: { 'status_validacao': 'pendente_parse_rapido' },
        candidates: {}
    };
}

// --- AWS Client Setup ---
if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn("AWS credentials are not fully set. Textract functionality will fail.");
}
export const textractClient = new TextractClient({});
const s3Client = new S3Client({});
const S3_BUCKET = process.env.AWS_TEXTRACT_S3_BUCKET;
const SYNC_LIMIT_MB = 4.5;

// --- S3 Helper ---
async function uploadToS3(buffer: Buffer, filename: string): Promise<string> {
    if (!S3_BUCKET) throw new Error("AWS_TEXTRACT_S3_BUCKET is not set.");
    const key = `holerite-uploads/${Date.now()}-${filename}`;
    await s3Client.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: buffer }));
    return key;
}

// --- Textract Async Polling Helper ---
async function pollForJobCompletion(jobId: string): Promise<GetDocumentAnalysisCommandOutput> {
    let attempts = 0;
    while (attempts < 24) { // Max 2 minutes
        await new Promise(resolve => setTimeout(resolve, 5000));
        const response = await textractClient.send(new GetDocumentAnalysisCommand({ JobId: jobId, MaxResults: 1000 }));
        if (response.JobStatus === JobStatus.SUCCEEDED) return response;
        if (response.JobStatus === JobStatus.FAILED || response.JobStatus === JobStatus.PARTIAL_SUCCESS) {
            throw new Error(`Textract job ${jobId} failed with status: ${response.JobStatus}`);
        }
        attempts++;
    }
    throw new Error(`Textract job ${jobId} timed out.`);
}

// --- Main Textract Logic ---
async function callTextract(buffer: Buffer, filename: string): Promise<{ extracted: HoleriteDraft, candidates: CandidatesMap }> {
    const useAsync = buffer.length > SYNC_LIMIT_MB * 1024 * 1024;
    const featureTypes = [FeatureType.FORMS, FeatureType.TABLES];
    let response: GetDocumentAnalysisCommandOutput;

    if (useAsync) {
        const s3Key = await uploadToS3(buffer, filename);
        const { JobId } = await textractClient.send(new StartDocumentAnalysisCommand({ DocumentLocation: { S3Object: { Bucket: S3_BUCKET, Name: s3Key } }, FeatureTypes: featureTypes }));
        if (!JobId) throw new Error("Failed to start Textract async job.");
        response = await pollForJobCompletion(JobId);
    } else {
        response = await textractClient.send(new AnalyzeDocumentCommand({ Document: { Bytes: buffer }, FeatureTypes: featureTypes }));
    }
    return mapTextractResponse(response, filename);
}

// --- Orchestration Pipeline ---
export async function extractHoleriteData(buffer: Buffer, filename: string) {
    // 1. Quick text parse
    try {
        const { default: pdfParse } = await import('pdf-parse');
        const data = await pdfParse(buffer);
        const text = data.text || '';
        const coverage = ['cnpj', 'liquido', 'vencimentos', 'descontos', 'salario', 'cpf'].filter(kw => text.toLowerCase().includes(kw)).length;
        if (coverage >= 4) {
            console.log("Attempting quick parse on text-based PDF.");
            return simpleRegexParser(text);
        }
    } catch (error) {
        // Fall through to Textract
    }

    // 2. AWS Textract
    try {
        return await callTextract(buffer, filename);
    } catch (error) {
        console.error("AWS Textract call failed. Proceeding to final fallback.", error);
    }

    // 3. Tesseract Fallback
    try {
        const ocrText = await ocrWithTesseract(buffer);
        return simpleRegexParser(ocrText);
    } catch (error) {
        console.error("Tesseract fallback failed.", error);
        return { extracted: { status_validacao: 'falha_total_extracao' } };
    }
}

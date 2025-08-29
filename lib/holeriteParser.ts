import pdfParse from 'pdf-parse';
import * as fs from 'fs/promises';
import { createWorker, type Worker as TesseractWorker } from 'tesseract.js';
import { ocrLog, ocrLogEnabled } from './ocrLogger';
import sharp from 'sharp';
import { RubricaEntry } from '../types/holerite';

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text || '';
}

export async function preprocessForOCR(input: Buffer): Promise<Buffer> {
  return sharp(input).grayscale().normalize().toBuffer();
}

async function pdfToImages(buffer: Buffer): Promise<Buffer[]> {
  const first = sharp(buffer, { density: 300 });
  const { pages = 1 } = await first.metadata();
  const imgs: Buffer[] = [];
  for (let i = 0; i < pages; i++) {
    const img = await sharp(buffer, { density: 300, page: i }).png().toBuffer();
    imgs.push(img);
  }
  return imgs;
}

export async function ocrWithTesseract(buffer: Buffer): Promise<string> {
  ocrLog('preprocess:start');
  const pre = await preprocessForOCR(buffer);
  ocrLog('preprocess:done', { inputBytes: buffer.byteLength });

  // Cria o worker sem opções (compatível com tipagens)
  const worker: TesseractWorker = await createWorker();

  try {
    ocrLog('worker:loadLanguage:start', 'por+eng');
    await worker.loadLanguage('por+eng');
    ocrLog('worker:loadLanguage:done');

    ocrLog('worker:initialize:start', 'por+eng');
    await worker.initialize('por+eng');
    ocrLog('worker:initialize:done');

    // 3 = AUTO
    ocrLog('worker:setParameters:start', { tessedit_pageseg_mode: '3' });
    await worker.setParameters({ tessedit_pageseg_mode: '3' });
    ocrLog('worker:setParameters:done');

    ocrLog('worker:recognize:start');
    const { data: { text } } = await worker.recognize(pre);
    ocrLog('worker:recognize:done', { chars: text?.length ?? 0 });
    return text || '';
  } finally {
    ocrLog('worker:terminate:start');
    await worker.terminate();
    ocrLog('worker:terminate:done');
  }
}

export async function ocrWithVision(buffer: Buffer): Promise<string> {
  const { ImageAnnotatorClient } = await import('@google-cloud/vision');
  const client = new ImageAnnotatorClient();
  const [result] = await client.textDetection({ image: { content: buffer } });
  return result?.fullTextAnnotation?.text ?? '';
}

// Extract text from PDF (native or scanned)
export async function extractTextFromPdf(file: string, ocrEngine: 'tesseract'|'vision'='tesseract'): Promise<string> {
  const buffer = await fs.readFile(file);
  let text = '';
  try {
    text = await extractPdfText(buffer);
  } catch {
    text = '';
  }
  if (text.trim().length > 40) {
    return cleanText(text);
  }
  const pages = await pdfToImages(buffer);
  const texts: string[] = [];
  for (const img of pages) {
    let pageText = '';
    if (ocrEngine === 'vision') {
      try {
        pageText = await ocrWithVision(img);
      } catch {
        pageText = await ocrWithTesseract(img);
      }
    } else {
      pageText = await ocrWithTesseract(img);
    }
    texts.push(pageText);
  }
  return cleanText(texts.join('\n'));
}

function cleanText(t: string): string {
  return t.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
}

// Normalize currency string to number
export function normalizeCurrency(v?: string): number {
  if (!v) return 0;
  const s = v.replace(/[^0-9,-]/g, '').replace('.', '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// Normalize date dd/mm/yyyy to yyyy-mm-dd
export function normalizeDate(v?: string): string {
  if (!v) return '';
  const m = v.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return '';
  const [_, d, mo, y] = m;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year.padStart(4,'0')}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
}

// Parse rubrica table from text
export function parseRubricas(text: string): RubricaEntry[] {
  const lines = text.split('\n');
  const rubricas: RubricaEntry[] = [];
  for (const line of lines) {
    const parts = line.trim().split(/\s{2,}/);
    if (parts.length >= 5 && /^\d{3,}/.test(parts[0])) {
      rubricas.push({
        codigo: parts[0],
        descricao: parts[1],
        quantidade: parts[2],
        valor_provento: normalizeCurrency(parts[3]),
        valor_desconto: normalizeCurrency(parts[4]),
      });
    }
  }
  return rubricas;
}

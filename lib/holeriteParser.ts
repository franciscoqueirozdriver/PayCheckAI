import * as fs from 'fs/promises';
import { createWorker, PSM } from 'tesseract.js';
import { ocrLog, ocrLogEnabled } from './ocrLogger';
import sharp from 'sharp';
import type { RubricaEntry } from '@/models/holerite';


export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default;
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
  let processedBuffer = buffer;
  try {
    ocrLog('preprocess:start');
    processedBuffer = await preprocessForOCR(buffer);
    ocrLog('preprocess:done', { inputBytes: buffer.byteLength });
  } catch (error) {
    console.error("Failed to preprocess image for OCR, attempting with original image.", error);
    ocrLog('preprocess:failed', { error: (error as Error).message });
  }

  const worker = await createWorker('por+eng', 1, {
    logger: ocrLogEnabled ? m => ocrLog('tesseract', m) : undefined,
  });

  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
    const { data: { text } } = await worker.recognize(processedBuffer);
    return text || '';
  } finally {
    await worker.terminate();
  }
}

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  let text = '';
  try {
    text = await extractPdfText(buffer);
  } catch {
    text = '';
  }
  if (text.trim().length > 40) {
    return cleanText(text);
  }

  let pages: Buffer[] = [];
  try {
    pages = await pdfToImages(buffer);
  } catch (error) {
     console.error("Failed to convert PDF to images, it might be a corrupted or unusual PDF.", error);
     // If pdfToImages fails, we can't proceed with OCR. Return empty text.
     return '';
  }

  const texts: string[] = [];
  for (const img of pages) {
    texts.push(await ocrWithTesseract(img));
  }
  return cleanText(texts.join('\n'));
}

function cleanText(t: string): string {
  return t.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
}

export function normalizeCurrency(v?: string): number {
  if (!v) return 0;
  const s = v.replace(/[^0-9,-]/g, '').replace('.', '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export function normalizeDate(v?: string): string {
  if (!v) return '';
  const m = v.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return '';
  const [_, d, mo, y] = m;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year.padStart(4,'0')}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
}

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

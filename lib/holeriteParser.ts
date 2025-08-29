import pdfParse from 'pdf-parse';
import * as fs from 'fs/promises';
import { fromBuffer } from 'pdf-img-convert';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { RubricaEntry } from '../types/holerite';

// Extract text from PDF (native or scanned)
export async function extractTextFromPdf(file: string, ocrEngine: 'tesseract'|'vision'='tesseract'): Promise<string> {
  const buffer = await fs.readFile(file);
  let text = '';
  try {
    const data = await pdfParse(buffer);
    text = data.text || '';
  } catch (err) {
    // ignore and fallback to OCR
    text = '';
  }
  if (text.trim().length > 40) {
    return cleanText(text);
  }
  // Fallback to OCR
  const pages = await fromBuffer(buffer, { width: 2000 });
  const texts: string[] = [];
  if (ocrEngine === 'vision') {
    const client = new ImageAnnotatorClient();
    for (const img of pages) {
      const [result] = await client.textDetection({ image: { content: img } });
      texts.push(result.fullTextAnnotation?.text || '');
    }
  } else {
    for (const img of pages) {
      const pre = await sharp(img).grayscale().threshold(150).toBuffer();
      const { data: { text: t } } = await Tesseract.recognize(pre, 'por+eng', { tessedit_pageseg_mode: 1 });
      texts.push(t);
    }
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

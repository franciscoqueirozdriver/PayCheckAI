import { createWorker, PSM } from 'tesseract.js';
import { ocrLog } from './ocrLogger';
import sharp from 'sharp';

// This function attempts to extract text directly from a PDF.
async function extractRawPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error("pdf-parse failed:", error);
    return '';
  }
}

// This function uses Tesseract OCR to extract text from an image buffer.
async function ocrImageBuffer(buffer: Buffer): Promise<string> {
  let processedBuffer = buffer;
  try {
    // Pre-processing can improve OCR accuracy but might fail on some formats.
    processedBuffer = await sharp(buffer).grayscale().normalize().toBuffer();
    ocrLog('ocr:preprocess:success');
  } catch (error) {
    console.warn("Image pre-processing failed, attempting OCR on original image.", error);
    ocrLog('ocr:preprocess:failed', { error: (error as Error).message });
  }

  const worker = await createWorker('por');
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
    const { data: { text } } = await worker.recognize(processedBuffer);
    ocrLog('ocr:recognize:success');
    return text;
  } catch(e) {
    console.error("Tesseract recognition failed:", e);
    return '';
  }
  finally {
    await worker.terminate();
  }
}

// This is the main orchestration function for this module.
// It tries a fast text extraction and falls back to slower, more robust OCR if needed.
export async function getTextFromPdf(buffer: Buffer): Promise<string> {
  // 1. Try fast text extraction first
  let text = await extractRawPdfText(buffer);

  // 2. If text is too short, assume it's an image and use OCR.
  // A heuristic of 100 characters is used to decide.
  if (text.trim().length < 100) {
    ocrLog('ocr:fallback:start', { reason: 'short_text' });
    try {
        const imageBuffer = await sharp(buffer, { density: 300 }).png().toBuffer();
        text = await ocrImageBuffer(imageBuffer);
    } catch(error) {
        console.error("Failed to convert PDF page to image for OCR.", error);
        ocrLog('ocr:fallback:failed', { error: (error as Error).message });
    }
  }

  // 3. Clean and return the final text.
  return text.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
}

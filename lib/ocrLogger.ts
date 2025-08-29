export function ocrLogEnabled(): boolean {
  return process.env.OCR_LOG === '1';
}

export function ocrLog(stage: string, extra?: unknown) {
  if (!ocrLogEnabled()) return;
  const ts = new Date().toISOString();
  // Use console.debug para não poluir logs de produção
  if (extra !== undefined) {
    console.debug(`[tesseract][${ts}] ${stage}`, extra);
  } else {
    console.debug(`[tesseract][${ts}] ${stage}`);
  }
}

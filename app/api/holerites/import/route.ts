import { NextResponse } from 'next/server';
import { extractTextFromPdfBuffer } from '@/lib/holeriteParser';
import { extractValorLiquido, extractTotalVencimentos } from '@/lib/importHolerites';

export async function POST(req: Request) {
  const formData = await req.formData();
  const files = formData.getAll('files');
  const results: { filename: string; text?: string; valorLiquido?: string | null; totalVencimentos?: string | null; error?: string }[] = [];

  for (const file of files) {
    if (!(file instanceof File)) continue;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    try {
      const text = await extractTextFromPdfBuffer(buffer);
      const valorLiquido = extractValorLiquido(text);
      const totalVencimentos = extractTotalVencimentos(text);
      results.push({ filename: file.name, text: text, valorLiquido: valorLiquido, totalVencimentos: totalVencimentos });
    } catch (err:any) {
      console.error(`Failed to process file ${file.name}:`, err);
      results.push({ filename: file.name, error: err.message });
    }
  }

  return NextResponse.json(results);
}

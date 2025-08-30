import { NextResponse } from 'next/server';
import { extractHoleriteData } from '@/lib/textractExtractor';

export async function POST(req: Request) {
  const formData = await req.formData();
  const files = formData.getAll('files');
  const results = [];

  for (const file of files) {
    if (!(file instanceof File)) continue;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    try {
      const data = await extractHoleriteData(buffer, file.name);
      results.push({ ...data, filename: file.name });
    } catch (err:any) {
      console.error(`Fatal error processing file ${file.name}:`, err);
      results.push({
          filename: file.name,
          extracted: { status_validacao: 'falha_inesperada' },
          candidates: {},
          error: err.message
      });
    }
  }

  return NextResponse.json(results);
}

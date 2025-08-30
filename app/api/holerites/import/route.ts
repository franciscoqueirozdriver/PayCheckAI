import { NextResponse } from 'next/server';
import { extractTextFromPdfBuffer } from '@/lib/holeriteParser';
import { processHoleriteText } from '@/lib/importHolerites';
import type { ImportPreview } from '@/models/holerite';

export async function POST(req: Request) {
  const formData = await req.formData();
  const files = formData.getAll('files');
  const userEmail = formData.get('user_email') as string | null;

  const previews: ImportPreview[] = [];

  for (const file of files) {
    if (!(file instanceof File)) continue;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    try {
      const text = await extractTextFromPdfBuffer(buffer);
      const { extracted, candidates } = processHoleriteText(text, { userEmail: userEmail || undefined, fonte: file.name });
      previews.push({ extracted, candidates, filename: file.name });
    } catch (err:any) {
      console.error(`Failed to process file ${file.name}:`, err);
      previews.push({
        extracted: { fonte_arquivo: file.name, status_validacao: 'erro' },
        candidates: {},
        filename: file.name,
      });
    }
  }

  return NextResponse.json(previews);
}

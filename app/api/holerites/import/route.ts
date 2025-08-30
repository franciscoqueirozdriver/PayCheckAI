import { NextResponse } from 'next/server';
import { extractTextFromPdfBuffer } from '@/lib/holeriteParser';
import { extractFields } from '@/lib/importHolerites';
import { HoleriteRow } from '@/types/holerite';

export async function POST(req: Request) {
  const formData = await req.formData();
  const files = formData.getAll('files');
  const userEmail = formData.get('user_email') as string | null;

  const previews: any[] = [];

  for (const file of files) {
    if (!(file instanceof File)) continue;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    try {
      const text = await extractTextFromPdfBuffer(buffer);
      const row: HoleriteRow = extractFields(text, { userEmail: userEmail || undefined, fonte: file.name });
      const extracted: Record<string, string> = {};
      Object.entries(row).forEach(([k,v]) => {
        extracted[k] = typeof v === 'number' ? String(v) : (v || '');
      });
      previews.push({ extracted, filename: file.name });
    } catch (err:any) {
      previews.push({ error: err.message, filename: file.name });
    }
  }

  return NextResponse.json(previews);
}

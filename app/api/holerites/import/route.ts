import { NextResponse } from 'next/server';
import { processHoleriteBuffer } from '@/lib/processHoleriteBuffer';
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
      const { extracted, candidates } = await processHoleriteBuffer(buffer, { userEmail: userEmail || undefined, filename: file.name });
      previews.push({ extracted, candidates, filename: file.name });
    } catch (err:any) {
      previews.push({ extracted: {}, candidates: {}, filename: file.name });
    }
  }

  return NextResponse.json(previews);
}

import { NextResponse } from 'next/server';
import { extractFromPdf } from '@/lib/holeriteExtractor';
import { writeFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  const data = await request.formData();
  const file = data.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const tmpPath = `/tmp/${randomUUID()}.pdf`;
  await writeFile(tmpPath, buffer);
  try {
    const result = await extractFromPdf(tmpPath);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

import { NextResponse } from 'next/server';
import { getTextFromPdf } from '@/lib/holeriteParser';
import { extractDataWithRegex } from '@/lib/regexExtractor';

export async function POST(req: Request) {
  const formData = await req.formData();
  const files = formData.getAll('files');
  const results = [];

  for (const file of files) {
    if (!(file instanceof File)) continue;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const text = await getTextFromPdf(buffer);

      if (!text) {
        throw new Error("Failed to extract any text from the document.");
      }

      const extractedData = extractDataWithRegex(text);
      results.push({ filename: file.name, data: extractedData });

    } catch (err:any) {
      console.error(`Error processing file ${file.name}:`, err);
      results.push({ filename: file.name, error: err.message });
    }
  }

  return NextResponse.json(results);
}

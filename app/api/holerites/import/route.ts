// app/api/holerites/import/route.ts
import { NextResponse } from "next/server";
import { extractHolerite } from "@/lib/holeriteExtract";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const files = form.getAll("files") as File[];

  const results = [];
  for (const f of files) {
    const buf = Buffer.from(await f.arrayBuffer());
    const extracted = await extractHolerite(buf);
    results.push({ extracted, filename: f.name, candidates: {} }); // se você usar "candidates", pode preencher aqui depois
  }

  return NextResponse.json(results, { status: 200 });
}


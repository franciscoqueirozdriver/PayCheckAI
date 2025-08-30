"use client";

import { useState } from "react";
import HoleriteReviewDialog from "@/components/HoleriteReviewDialog";
import type { HoleriteDraft, CandidatesMap } from "@/models/holerite";
import { Button } from "@/components/ui/button";

type Item = { file: File; extracted: HoleriteDraft; candidates: CandidatesMap };

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  async function handleImport(input: HTMLInputElement) {
    const files = Array.from(input.files || []);
    if (!files.length) return;

    const fd = new FormData();
    files.forEach(f => fd.append("files", f));

    const res = await fetch("/api/holerites/import", { method: "POST", body: fd });
    const previews: Array<{ extracted: HoleriteDraft; candidates?: CandidatesMap; filename: string }> = await res.json();

    const merged: Item[] = previews.map((p, i) => ({
      file: files[i],
      extracted: p.extracted || {},
      candidates: p.candidates || {}
    }));

    setItems(merged);
    setIdx(0);
    setOpen(true);
    input.value = ""; // limpa seleção
  }

  async function saveToSheets(finalData: HoleriteDraft) {
    const r = await fetch("/api/holerites/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalData),
    });
    if (!r.ok) throw new Error("Falha ao salvar");

    // Avança para o próximo item se houver
    if (idx < items.length - 1) {
      setIdx(prev => prev + 1);
    } else {
      // Se for o último, fecha o modal
      setOpen(false);
    }
  }

  const current = items[idx];

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <input id="uploader" type="file" accept="application/pdf" multiple hidden onChange={(e) => handleImport(e.currentTarget)} />
        <Button onClick={() => document.getElementById("uploader")?.click()}>Importar holerites</Button>
      </div>

      <HoleriteReviewDialog
        open={open}
        onOpenChange={setOpen}
        file={current?.file}
        extracted={current?.extracted || {}}
        candidates={current?.candidates || {}}
        onSave={saveToSheets}
      />
    </main>
  );
}

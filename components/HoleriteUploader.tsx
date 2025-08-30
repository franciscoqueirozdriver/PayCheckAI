'use client';

import React, { useState } from 'react';

export default function HoleriteUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setIsLoading(true);
    try {
      const res = await fetch('/api/extrair-holerite', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to extract');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ error: 'Falha na extração' });
    } finally {
      setIsLoading(false);
    }
  };

  const buttonStyle = "bg-primary-500 text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold shadow-sm hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors";

  return (
    <section className="bg-card text-card-foreground p-card-p rounded-2xl shadow-elevation-1 mb-6">
      <h3 className="text-base font-semibold mb-3 text-foreground">Extrair Holerite</h3>
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="text-sm"
        />
        <button
          type="button"
          className={buttonStyle}
          onClick={handleUpload}
          disabled={!file || isLoading}
        >
          {isLoading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
      {result && (
        <pre className="mt-4 p-2 bg-muted rounded text-xs overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </section>
  );
}


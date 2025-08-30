import { normalizeCurrency } from './holeriteParser';

function matchAll(text: string, regex: RegExp, index: number = 1): string[] {
  const globalRegex = new RegExp(regex.source, 'gi');
  const matches = Array.from(text.matchAll(globalRegex));
  const unique = new Set(matches.map(m => m[index].trim()));
  return Array.from(unique).filter(Boolean);
}

export function extractValorLiquido(text: string): string | null {
    const specificMatches = matchAll(text, /Valor Líquido\s*:\s*R?\$\s*([0-9.,]+)/i, 1);
    if (specificMatches.length > 0) {
        return String(normalizeCurrency(specificMatches[0]));
    }

    const fallbackMatches = matchAll(text, /(l.quido\s*a\s*receber|valor\s*l.quido)\s*[:\s-]*\s*([0-9.,\sR$]+)/i, 2);
    if (fallbackMatches.length > 0) {
        return String(normalizeCurrency(fallbackMatches[0]));
    }

    return null;
}

export function extractTotalVencimentos(text: string): string | null {
    const specificMatches = matchAll(text, /(?:➡️\s*)?Total de Vencimentos\s*:\s*R?\$\s*([0-9.,]+)/i, 1);
    if (specificMatches.length > 0) {
        return String(normalizeCurrency(specificMatches[0]));
    }

    const fallbackMatches = matchAll(text, /(total\s*de\s*proventos|total\s*vencimentos|total\s*cr.ditos)\s*[:\s-]*\s*([0-9.,\sR$]+)/i, 2);
    if (fallbackMatches.length > 0) {
        return String(normalizeCurrency(fallbackMatches[0]));
    }

    return null;
}

import type { Holerite } from '@/models/holerite';

// Helper function to find a value based on a regex pattern.
// It looks for a keyword and captures the value that follows.
function findValue(text: string, regex: RegExp): string | null {
    const match = text.match(regex);
    if (match && match[1]) {
        return match[1].trim();
    }
    return null;
}

// Helper function to find and normalize a monetary value.
function findMonetaryValue(text: string, regex: RegExp): number | null {
    const match = findValue(text, regex);
    if (match) {
        // Basic normalization: remove "R$", trim, convert comma to dot.
        const normalized = match.replace(/R\$\s*/, '').replace(/\./g, '').replace(',', '.');
        const value = parseFloat(normalized);
        return isNaN(value) ? null : value;
    }
    return null;
}

// Main extraction function for this module.
export function extractDataWithRegex(text: string): Holerite {
    const defaultHolerite: Holerite = {
        nomeFuncionario: null,
        cargo: null,
        periodo: null,
        totalVencimentos: null,
        totalDescontos: null,
        valorLiquido: null,
        detalhes: [],
    };

    const extractedData: Partial<Holerite> = {};

    // Using the patterns specified by the user.
    extractedData.nomeFuncionario = findValue(text, /(?:Nome do Funcionario|Nome do Funcionari)\s*[:\-]?\s*([^\n\r]+)/i);
    extractedData.cargo = findValue(text, /(?:Cargo|CBO)\s*[:\-]?\s*([^\n\r]+)/i);

    extractedData.totalVencimentos = findMonetaryValue(text, /(?:Total de Vencimentos|TOTAL DE VENCIMENTOS)\s*[:\-]?\s*(R\$\s*[\d.,]+)/i);
    extractedData.totalDescontos = findMonetaryValue(text, /(?:Total de Descontos|TOTAL DE DESCONTOS)\s*[:\-]?\s*(R\$\s*[\d.,]+)/i);
    extractedData.valorLiquido = findMonetaryValue(text, /(?:Valor Liquido|VALOR LIQUIDO)\s*[:\-]?\s*(R\$\s*[\d.,]+)/i);

    // --- Table Details Extraction ---
    const details = [];
    const lines = text.split('\n');
    // Regex to find lines that look like table rows with monetary values.
    // It captures a description and up to two monetary values.
    const rowRegex = /([A-ZÇÃÁÉÍÓÚ\s\d.,/()]+?)\s{2,}([\d.,]+)\s*([\d.,]+)?/i;

    let inVencimentos = false;
    let inDescontos = false;

    for (const line of lines) {
        if (/vencimentos/i.test(line)) {
            inVencimentos = true;
            inDescontos = false;
            continue;
        }
        if (/descontos/i.test(line)) {
            inVencimentos = false;
            inDescontos = true;
            continue;
        }

        const match = line.match(rowRegex);

        if (match) {
            const description = match[1].trim();
            const value1 = match[2] ? parseFloat(match[2].replace(/\./g, '').replace(',', '.')) : null;
            const value2 = match[3] ? parseFloat(match[3].replace(/\./g, '').replace(',', '.')) : null;

            const detail: any = {
                codigo: '', // Code extraction is complex without clear columns
                descricao: description,
                referencia: null, // Ref extraction is also complex
                vencimentos: null,
                descontos: null,
            };

            if (inVencimentos) {
                detail.vencimentos = value2 || value1;
                detail.referencia = value2 ? value1 : null;
            } else if (inDescontos) {
                detail.descontos = value2 || value1;
                detail.referencia = value2 ? value1 : null;
            }
            details.push(detail);
        }
    }
    extractedData.detalhes = details;

    const finalData: Holerite = {
        ...defaultHolerite,
        ...extractedData,
    };

    return finalData;
}

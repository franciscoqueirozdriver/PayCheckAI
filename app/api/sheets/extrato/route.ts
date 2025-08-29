import { NextResponse } from 'next/server';
import { getRows, addRow } from '@/lib/googleSheetService';

// O título da aba na Planilha Google que esta API irá gerenciar.
const SHEET_TITLE = 'Extrato';

/**
 * Handler para requisições GET.
 * Busca e retorna todos os dados da aba 'Extrato'.
 */
export async function GET() {
    try {
        const rows = await getRows(SHEET_TITLE);
        // Mapeia as linhas para um formato de objeto JSON simples.
        const data = rows.map(row => row.toObject());
        return NextResponse.json({ success: true, data });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Um erro desconhecido ocorreu.';
        console.error(`[API Extrato GET] Erro: ${errorMessage}`);
        return NextResponse.json({ success: false, message: 'Falha ao buscar dados da planilha.', error: errorMessage }, { status: 500 });
    }
}

/**
 * Handler para requisições POST.
 * Adiciona uma nova linha de dados na aba 'Extrato'.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validação simples do corpo da requisição.
        if (!body || Object.keys(body).length === 0) {
            return NextResponse.json({ success: false, message: 'Corpo da requisição inválido ou vazio.' }, { status: 400 });
        }

        const newRow = await addRow(SHEET_TITLE, body);

        return NextResponse.json({
            success: true,
            message: 'Extrato adicionado com sucesso.',
            data: newRow.toObject()
        }, { status: 201 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Um erro desconhecido ocorreu.';
        console.error(`[API Extrato POST] Erro: ${errorMessage}`);
        return NextResponse.json({ success: false, message: 'Falha ao adicionar dados na planilha.', error: errorMessage }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// PROXY DE EXEMPLO: A URL real da API Elekto Delta deve ser configurada.
const ELEKTO_API_URL = 'https://api.elekto.delta/dias-uteis';

/**
 * Proxy para um endpoint legado (ex: Elekto Delta).
 * Recebe: initialDate, finalDate, type=financial
 * Repassa para a API externa.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const initialDate = searchParams.get('initialDate');
  const finalDate = searchParams.get('finalDate');
  const type = searchParams.get('type') || 'financial';

  if (!initialDate || !finalDate) {
    return NextResponse.json({ error: 'Parâmetros initialDate e finalDate são obrigatórios.' }, { status: 400 });
  }

  try {
    // Constrói a URL de destino e repassa os parâmetros
    const targetUrl = new URL(ELEKTO_API_URL);
    targetUrl.searchParams.set('initialDate', initialDate);
    targetUrl.searchParams.set('finalDate', finalDate);
    targetUrl.searchParams.set('type', type);

    // NOTA: Em um cenário real, trataríamos de autenticação aqui (ex: API Keys)
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json({ error: 'Falha ao buscar dados da API externa.', details: errorBody }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Proxy error for Elekto dias-do-mes:', error);
    return NextResponse.json({ error: 'Erro interno no proxy.' }, { status: 500 });
  }
}

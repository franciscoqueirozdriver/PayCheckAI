import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// PROXY DE EXEMPLO: A URL real da API Elekto deve ser configurada.
const ELEKTO_API_URL = 'https://api.elekto.delta/feriados-nacionais';

/**
 * Proxy simples para um endpoint legado de feriados nacionais.
 */
export async function GET(request: NextRequest) {
  try {
    // NOTA: Em um cenário real, trataríamos de autenticação aqui (ex: API Keys)
    const response = await fetch(ELEKTO_API_URL, {
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
    console.error('Proxy error for Elekto feriados-nacionais:', error);
    return NextResponse.json({ error: 'Erro interno no proxy.' }, { status: 500 });
  }
}

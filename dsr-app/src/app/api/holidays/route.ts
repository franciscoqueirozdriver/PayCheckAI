import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const year = yearParam || new Date().getFullYear().toString();

  // Validate if the year is a number and within a reasonable range
  if (!/^\d{4}$/.test(year) || parseInt(year) < 1900 || parseInt(year) > 2100) {
    return NextResponse.json({ error: 'Ano inválido. Forneça um ano de 4 dígitos.' }, { status: 400 });
  }

  const brasilApiUrl = `https://brasilapi.com.br/api/feriados/v1/${year}`;

  try {
    const response = await fetch(brasilApiUrl, {
        // Next.js 14 caching options. Revalidate every 24 hours.
        next: { revalidate: 86400 }
    });

    if (!response.ok) {
      // The API might return 404 for years it doesn't support, or other errors.
      const errorData = await response.json().catch(() => ({})); // Try to parse error, but don't fail if it's not JSON
      return NextResponse.json(
        {
          error: 'Falha ao buscar feriados na BrasilAPI.',
          details: errorData.message || `Status: ${response.status}`
        },
        { status: response.status }
      );
    }

    const holidays = await response.json();
    return NextResponse.json(holidays);

  } catch (error) {
    console.error('Erro de rede ou de parsing na API /api/holidays:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno ao se comunicar com a API de feriados.' }, { status: 500 });
  }
}

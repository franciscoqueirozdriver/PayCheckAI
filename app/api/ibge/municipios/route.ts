import { NextRequest, NextResponse } from 'next/server';
import { getMunicipalitiesSorted } from '@/lib/ibgeUtils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uf = searchParams.get('uf');

  if (!uf) {
    return NextResponse.json(
      { error: 'Parâmetro "uf" (sigla do estado) é obrigatório.' },
      { status: 400 }
    );
  }

  try {
    const municipalities = await getMunicipalitiesSorted(uf);
    return NextResponse.json(municipalities);
  } catch (error) {
    // The utility function already logs the specific error.
    // This is a fallback for errors within the route handler itself.
    console.error(`Error in /api/ibge/municipios route handler for UF ${uf}:`, error);
    return NextResponse.json(
      { error: `Erro interno ao processar a solicitação para ${uf}.` },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSortedMunicipalities } from '../../../../lib/ibgeUtils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uf = searchParams.get('uf');

  if (!uf) {
    return NextResponse.json({ error: 'Parâmetro "uf" (sigla do estado) é obrigatório.' }, { status: 400 });
  }

  try {
    const sortedMunicipalities = await getSortedMunicipalities(uf);
    return NextResponse.json(sortedMunicipalities);
  } catch (error) {
    // A função getSortedMunicipalities já loga o erro, mas podemos logar aqui também se necessário.
    console.error(`Error in municipalities route handler for UF ${uf}:`, error);
    return NextResponse.json({ error: `Erro interno ao processar municípios para ${uf}.` }, { status: 500 });
  }
}

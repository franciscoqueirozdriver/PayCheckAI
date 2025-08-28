import { NextRequest, NextResponse } from 'next/server';

interface IBGEMunicipio {
  id: number;
  nome: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uf = searchParams.get('uf');

  if (!uf) {
    return NextResponse.json({ error: 'Parâmetro "uf" (sigla do estado) é obrigatório.' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`, {
      next: { revalidate: 604800 }, // Cache for 1 week
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch municipalities from IBGE API for UF: ${uf}`);
    }

    const municipios: IBGEMunicipio[] = await response.json();

    // The API for /estados/{UF}/municipios does not support orderBy, so we sort here.
    municipios.sort((a, b) => a.nome.localeCompare(b.nome));

    // Format for a <select> dropdown
    const formattedMunicipios = municipios.map(municipio => ({
      value: String(municipio.id), // The IBGE code
      label: municipio.nome,
    }));

    return NextResponse.json(formattedMunicipios);

  } catch (error) {
    console.error(`Error fetching IBGE municipios for UF ${uf}:`, error);
    return NextResponse.json({ error: `Erro interno ao buscar municípios para ${uf}.` }, { status: 500 });
  }
}

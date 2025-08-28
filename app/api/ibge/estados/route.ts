import { NextResponse } from 'next/server';

interface IBGEEstado {
  id: number;
  sigla: string;
  nome: string;
}

export async function GET() {
  try {
    const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados', {
      next: { revalidate: 604800 }, // Cache for 1 week
    });

    if (!response.ok) {
      throw new Error('Failed to fetch states from IBGE API');
    }

    const states: IBGEEstado[] = await response.json();

    // Sort states alphabetically by name
    states.sort((a, b) => a.nome.localeCompare(b.nome));

    // Format for a <select> dropdown
    const formattedStates = states.map(state => ({
      value: state.sigla,
      label: state.nome,
    }));

    return NextResponse.json(formattedStates);

  } catch (error) {
    console.error('Error fetching IBGE states:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar estados.' }, { status: 500 });
  }
}

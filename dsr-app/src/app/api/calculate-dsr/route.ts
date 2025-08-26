import { NextResponse } from 'next/server';
import { calculateDSR, DSRCalculationParams } from '@/lib/dsr-calculator';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation to ensure the body contains the necessary parameters
    if (!body || typeof body.totalCommission !== 'number' || typeof body.workingDays !== 'number' || typeof body.restDays !== 'number') {
      return NextResponse.json({ error: 'Parâmetros inválidos. Forneça totalCommission, workingDays e restDays.' }, { status: 400 });
    }

    const params: DSRCalculationParams = {
      totalCommission: body.totalCommission,
      workingDays: body.workingDays,
      restDays: body.restDays,
    };

    const result = calculateDSR(params);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erro na API /api/calculate-dsr:', error);

    // Handle JSON parsing errors or other unexpected errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Corpo da requisição JSON inválido.' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}

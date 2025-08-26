import { NextResponse } from 'next/server';
import { calcularDSRporPagamento, PaymentRow, DayCounts } from '@/lib/dsr-calculator';
import { getDayCountsForMonth } from '@/lib/date-helper';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const payments: PaymentRow[] = body.payments;
    const mesAno: string = body.mesAno; // e.g., "2024-08"
    const usarComSabado: boolean = body.usarComSabado;

    // Basic validation
    if (!Array.isArray(payments) || !mesAno || typeof usarComSabado !== 'boolean') {
      return NextResponse.json({ error: 'Parâmetros inválidos. Forneça "payments", "mesAno" e "usarComSabado".' }, { status: 400 });
    }

    const [year, month] = mesAno.split('-').map(Number);
    if (!year || !month) {
        return NextResponse.json({ error: 'Formato de "mesAno" inválido. Use AAAA-MM.' }, { status: 400 });
    }

    // Automatically get the day counts from our new helper
    const dayCounts = await getDayCountsForMonth(year, month);

    const dayCountsForCalc: DayCounts = {
        ...dayCounts,
        usarComSabado: usarComSabado,
    };

    const results = payments.map(payment => calcularDSRporPagamento(payment, dayCountsForCalc));

    // Calculate totals
    const totals = results.reduce((acc, result) => {
      acc.totalComissaoBruta += result.comissaoBruta;
      acc.totalComissaoLiquida += result.comissaoLiquida;
      acc.totalDsrBruto += result.dsrBruto;
      acc.totalDsrLiquido += result.dsrLiquido;
      return acc;
    }, {
      totalComissaoBruta: 0,
      totalComissaoLiquida: 0,
      totalDsrBruto: 0,
      totalDsrLiquido: 0,
    });

    return NextResponse.json({
      details: results,
      totals: totals,
      dayCounts: dayCounts, // Also return the calculated day counts for display on the frontend
    });

  } catch (error) {
    console.error('Erro na API /api/calculate-dsr:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Corpo da requisição JSON inválido.' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}

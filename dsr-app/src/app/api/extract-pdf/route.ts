import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // In a real implementation, we would process the multipart/form-data
    // const formData = await request.formData();
    // const file = formData.get('file');
    // Here, we'll just simulate a successful OCR extraction.

    // Simulate a delay, as OCR is a slow process
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockExtractedData = {
      employeeId: '78910',
      documentType: 'payslip', // or 'contract'
      month: 'Fevereiro/2024',
      commissions: [
        { description: 'Venda Produto A', value: 150.25 },
        { description: 'Venda Produto B', value: 300.00 },
        { description: 'Venda Produto C', value: 55.50 },
      ],
      totalCommission: 505.75,
      paidDSR: 91.95, // Value found on the payslip
    };

    return NextResponse.json(mockExtractedData);

  } catch (error) {
    console.error('Erro na API /api/extract-pdf:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor durante a extração do PDF.' }, { status: 500 });
  }
}

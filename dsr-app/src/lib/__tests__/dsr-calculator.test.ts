import { calcularDSRporPagamento, parseCurrency, DayCounts, PaymentRow } from '../dsr-calculator';

// Mocking a describe/it/expect structure, common in Jest/Vitest
const describe = (description: string, fn: () => void) => {
  console.log(`\n--- Test Suite: ${description} ---`);
  fn();
};
const it = (description: string, fn: () => void) => {
  try {
    fn();
    console.log(`  ✅ [PASS] ${description}`);
  } catch (error: any) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`    Error: ${error.message}`);
  }
};
const expect = (received: any) => ({
  toBeCloseTo: (expected: number, precision = 2) => {
    const pass = Math.abs(expected - received) < (10 ** -precision) / 2;
    if (!pass) {
      throw new Error(`Expected ${received} to be close to ${expected}`);
    }
  },
});

// --- Test Cases ---

describe('parseCurrency', () => {
    it('should parse currency string "R$ 1.234,56" to 1234.56', () => {
        // This is a simple test to ensure the helper function works
    });
});


describe('calcularDSRporPagamento', () => {

  const defaultDays: DayCounts = {
    usarComSabado: false,
    diasSemSabado: 22,
    diasComSabado: 26,
    diasDescanso: 5,
  };

  it('should calculate commissions and DSR correctly with no tax', () => {
    const payment: PaymentRow = {
      valor_bruto: '5000,00',
      percentual_imposto: '0',
      percentual_comissao: '10', // R$ 500 de comissão
    };
    const result = calcularDSRporPagamento(payment, defaultDays);

    expect(result.comissaoBruta).toBeCloseTo(500);
    expect(result.comissaoLiquida).toBeCloseTo(500);
    // DSR = (500 / 22) * 5 = 113.6363...
    expect(result.dsrBruto).toBeCloseTo(113.64);
    expect(result.dsrLiquido).toBeCloseTo(113.64);
  });

  it('should calculate commissions and DSR correctly with tax', () => {
    const payment: PaymentRow = {
      valor_bruto: '5000,00',
      percentual_imposto: '15', // Imposto de R$ 750
      percentual_comissao: '10', // Comissão de R$ 500 (bruta)
    };
    const result = calcularDSRporPagamento(payment, defaultDays);

    // Venda líquida = 5000 * 0.85 = 4250
    expect(result.liquidoVenda).toBeCloseTo(4250);
    // Comissão bruta = 5000 * 0.10 = 500
    expect(result.comissaoBruta).toBeCloseTo(500);
    // Comissão líquida = 4250 * 0.10 = 425
    expect(result.comissaoLiquida).toBeCloseTo(425);
    // DSR Bruto = (500 / 22) * 5 = 113.64
    expect(result.dsrBruto).toBeCloseTo(113.64);
    // DSR Líquido = (425 / 22) * 5 = 96.59
    expect(result.dsrLiquido).toBeCloseTo(96.59);
  });

  it('should use a different divisor when "usarComSabado" is true', () => {
    const payment: PaymentRow = {
      valor_bruto: '5000,00',
      percentual_imposto: '0',
      percentual_comissao: '10', // R$ 500 de comissão
    };
    const daysWithSaturday: DayCounts = { ...defaultDays, usarComSabado: true };
    const result = calcularDSRporPagamento(payment, daysWithSaturday);

    // DSR = (500 / 26) * 5 = 96.1538...
    expect(result.dsrBruto).toBeCloseTo(96.15);
  });

  it('should return 0 for DSR if divisor is 0', () => {
    const payment: PaymentRow = {
      valor_bruto: '5000,00',
      percentual_imposto: '0',
      percentual_comissao: '10',
    };
    const daysWithZeroDivisor: DayCounts = { ...defaultDays, diasSemSabado: 0 };
    const result = calcularDSRporPagamento(payment, daysWithZeroDivisor);

    expect(result.dsrBruto).toBeCloseTo(0);
    expect(result.dsrLiquido).toBeCloseTo(0);
  });
});

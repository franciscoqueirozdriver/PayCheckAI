import { calculateDSR, DSRCalculationParams } from '../dsr-calculator';

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
  toBe: (expected: any) => {
    if (received !== expected) {
      throw new Error(`Expected ${received} to be ${expected}`);
    }
  },
  toEqual: (expected: any) => {
    if (JSON.stringify(received) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(received)} to be equal to ${JSON.stringify(expected)}`);
    }
  }
});


// --- Test Cases ---

describe('calculateDSR', () => {

  it('should calculate the DSR correctly for a standard case', () => {
    const params: DSRCalculationParams = {
      totalCommission: 1000,
      workingDays: 20,
      restDays: 5,
    };
    const result = calculateDSR(params);
    expect(result.calculatedDSR).toBe(250.00);
    expect(result.dailyRate).toBe(50.00);
  });

  it('should handle floating point commissions and round correctly', () => {
    const params: DSRCalculationParams = {
      totalCommission: 1500.75,
      workingDays: 22,
      restDays: 5,
    };
    const result = calculateDSR(params);
    expect(result.calculatedDSR).toBe(341.08); // (1500.75 / 22) * 5 = 341.0795...
    expect(result.dailyRate).toBe(68.22);    // 1500.75 / 22 = 68.2159...
  });

  it('should return 0 if totalCommission is 0', () => {
    const params: DSRCalculationParams = {
      totalCommission: 0,
      workingDays: 22,
      restDays: 5,
    };
    const result = calculateDSR(params);
    expect(result.calculatedDSR).toBe(0);
    expect(result.dailyRate).toBe(0);
  });

  it('should return 0 if restDays is 0', () => {
    const params: DSRCalculationParams = {
      totalCommission: 1000,
      workingDays: 22,
      restDays: 0,
    };
    const result = calculateDSR(params);
    expect(result.calculatedDSR).toBe(0);
  });

  it('should return 0 if workingDays is 0 to prevent division by zero', () => {
    const params: DSRCalculationParams = {
      totalCommission: 1000,
      workingDays: 0,
      restDays: 5,
    };
    const result = calculateDSR(params);
    expect(result.calculatedDSR).toBe(0);
    expect(result.dailyRate).toBe(0);
  });

});

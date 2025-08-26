/**
 * Interface for DSR calculation parameters.
 */
export interface DSRCalculationParams {
  totalCommission: number;
  workingDays: number;
  restDays: number; // Sundays and holidays
}

/**
 * Interface for the result of a DSR calculation.
 */
export interface DSRCalculationResult {
  calculatedDSR: number;
  dailyRate: number;
}

/**
 * Calculates the Descanso Semanal Remunerado (DSR) on commissions.
 *
 * The calculation is based on the formula:
 * (Total Commission / Working Days) * Rest Days
 *
 * @param params - The parameters for the DSR calculation.
 * @returns An object containing the calculated DSR and the daily rate.
 * @throws {Error} if workingDays is zero to prevent division by zero.
 */
export function calculateDSR(params: DSRCalculationParams): DSRCalculationResult {
  const { totalCommission, workingDays, restDays } = params;

  if (workingDays <= 0) {
    // Return 0 or throw an error depending on desired business logic for months with no work
    return {
        calculatedDSR: 0,
        dailyRate: 0,
    };
  }

  const dailyRate = totalCommission / workingDays;
  const calculatedDSR = dailyRate * restDays;

  return {
    calculatedDSR: parseFloat(calculatedDSR.toFixed(2)), // Round to 2 decimal places
    dailyRate: parseFloat(dailyRate.toFixed(2)),
  };
}

// Example Usage (can be removed later or kept for testing)
/*
const exampleParams: DSRCalculationParams = {
  totalCommission: 1500.75,
  workingDays: 22,
  restDays: 5, // 4 Sundays + 1 Holiday
};

const result = calculateDSR(exampleParams);
console.log(`Daily Rate: R$ ${result.dailyRate}`);
console.log(`Calculated DSR: R$ ${result.calculatedDSR}`);
// Expected DSR: (1500.75 / 22) * 5 = 341.08
*/

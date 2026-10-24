/**
 * FinanceSystem manages municipal taxation, savings interest / reserves,
 * civic subsidies, business profit margins, and fiscal solvency in NEURAL CITY.
 */
export class FinanceSystem {
  /**
   * @param {Object} [config]
   * @param {number} [config.baseTaxRate=0.15]
   * @param {number} [config.savingsInterestRate=0.001]
   */
  constructor(config = {}) {
    this.baseTaxRate = config.baseTaxRate || 0.15;
    this.savingsInterestRate = config.savingsInterestRate || 0.001; // yield per tick
  }

  /**
   * Calculate taxes owed on income and collect municipal revenue.
   * @param {number} grossIncome
   * @param {number} taxRate
   * @returns {{ netIncome: number, taxPaid: number }}
   */
  processTax(grossIncome, taxRate = this.baseTaxRate) {
    const rate = Math.max(0.01, Math.min(0.50, taxRate));
    const taxPaid = Number((grossIncome * rate).toFixed(2));
    const netIncome = Number((grossIncome - taxPaid).toFixed(2));
    return { netIncome, taxPaid };
  }

  /**
   * Process periodic interest yield on citizen savings.
   * Encourages savings accumulation without unbounded money creation.
   *
   * @param {number} savings
   * @returns {number} Interest earned
   */
  accrueInterest(savings) {
    if (savings <= 0) return 0;
    return Number((savings * this.savingsInterestRate).toFixed(2));
  }

  /**
   * Calculate business operational accounting:
   * Revenue = goods sold + service fees
   * Costs = wages paid + resource maintenance + raw material consumption
   * Profit = Revenue - Costs
   * Taxes = Profit > 0 ? Profit * taxRate : 0
   * Net Profit = Profit - Taxes
   *
   * @param {Object} business
   * @param {number} revenue
   * @param {number} wageExpenses
   * @param {number} maintenanceCost
   * @param {number} taxRate
   * @returns {{ revenue: number, costs: number, profit: number, taxPaid: number, netProfit: number }}
   */
  calculateBusinessBalance(business, revenue, wageExpenses, maintenanceCost, taxRate = this.baseTaxRate) {
    const costs = Number((wageExpenses + maintenanceCost).toFixed(2));
    const grossProfit = Number((revenue - costs).toFixed(2));
    
    let taxPaid = 0;
    if (grossProfit > 0) {
      taxPaid = Number((grossProfit * taxRate).toFixed(2));
    }

    const netProfit = Number((grossProfit - taxPaid).toFixed(2));

    return {
      revenue,
      costs,
      profit: grossProfit,
      taxPaid,
      netProfit,
    };
  }

  /**
   * Evaluate municipal fiscal health index (0 to 100).
   * @param {number} treasury
   * @param {number} income
   * @param {number} expenses
   * @returns {number}
   */
  calculateFiscalHealth(treasury, income, expenses) {
    const surplusRatio = expenses > 0 ? income / expenses : 1.0;
    const treasuryScore = Math.min(50, (treasury / 50000) * 50);
    const balanceScore = Math.min(50, surplusRatio * 40);

    return Math.max(0, Math.min(100, Math.round(treasuryScore + balanceScore)));
  }
}

export default FinanceSystem;

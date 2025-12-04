import { Bond, BondType, Constants } from './constants';

export interface SimulationResult {
  months: number[];
  values: number[];
  totalProfit: number;
  netProfit: number;
}

export class BondCalculator {
  /**
   * Calculates the value of the investment over time.
   * @param bond The bond type
   * @param amount Initial investment amount
   * @param inflationRate Assumed constant inflation rate for indexed bonds (after 1st year)
   */
  static simulate(bond: Bond, amount: number, inflationRate = 0): SimulationResult {
    const months: number[] = [];
    const values: number[] = [];
    let currentCapital = amount;
    let accumulatedInterest = 0;

    // Simplified simulation
    // For indexed bonds (COI, EDO), first year is fixed rate, subsequent years are inflation + margin
    // Margin is roughly current rate - inflation (very simplified assumption for this demo)
    // Actually margin is fixed defined in bond terms, let's assume margin = initialRate - 2% (approx) or just use a fixed margin.
    // Let's assume margin for COI is 1.5% and EDO is 2.0% for simplicity if not defined.

    const margin = bond.type === BondType.COI ? 1.5 : bond.type === BondType.EDO ? 2.0 : 0;

    for (let m = 0; m <= bond.durationMonths; m++) {
      months.push(m);

      if (m === 0) {
        values.push(currentCapital);
        continue;
      }

      // Interest calculation logic
      // This is a simplified model.

      // 1. Monthly capitalization/payment (ROR, DOR)
      if (bond.capitalizationFreqMonths === 1) {
        // Monthly rate = rate / 12
        // ROR/DOR pay out interest monthly, capital doesn't grow, but we simulate "total value" as if we kept the cash
        // Or should we simulate reinvestment? The user usually gets cash.
        // Let's assume we just track total value (Capital + Payouts)
        const annualRate = bond.interestRate; // Simplified: constant rate for ROR/DOR
        const monthlyRate = annualRate / 100 / 12;
        accumulatedInterest += amount * monthlyRate;
        values.push(amount + accumulatedInterest);
      }
      // 2. Annual capitalization (TOS, EDO) or Payment (COI)
      else if (bond.capitalizationFreqMonths === 12) {
        if (m % 12 === 0) {
          const year = m / 12;
          let rate = bond.interestRate;

          // For indexed bonds, after year 1, rate = inflation + margin
          if (bond.isIndexedToInflation && year > 1) {
            rate = inflationRate + margin;
          }

          const annualInterest = currentCapital * (rate / 100);

          if (bond.type === BondType.COI) {
            // COI pays out interest annually
            accumulatedInterest += annualInterest;
          } else {
            // TOS, EDO capitalize interest
            currentCapital += annualInterest;
          }
        }
        // For visualization, we can interpolate or just show steps. Let's show steps (flat between years)
        // or linear growth for visual appeal? Let's stick to accurate steps for capitalization
        // but for "value over time" graph, linear looks better.
        // Let's just push current state.
        values.push(currentCapital + accumulatedInterest);
      }
      // 3. At maturity (OTS)
      else if (bond.capitalizationFreqMonths === 0) {
        if (m === bond.durationMonths) {
          const interest = currentCapital * (bond.interestRate / 100) * (bond.durationMonths / 12);
          currentCapital += interest;
        }
        values.push(currentCapital);
      } else {
        values.push(currentCapital);
      }
    }

    const totalValue = values[values.length - 1];
    const grossProfit = totalValue - amount;
    const tax = Math.max(0, grossProfit * Constants.TAX_RATE);
    const netProfit = grossProfit - tax;

    return {
      months,
      values,
      totalProfit: grossProfit,
      netProfit: netProfit,
    };
  }

  /**
   * Calculates the value received when redeeming a bond early.
   * @param bond The bond type
   * @param amount Initial investment amount
   * @param redemptionMonth Month at which the bond is redeemed (must be < durationMonths)
   * @param inflationRate Assumed constant inflation rate for indexed bonds (after 1st year)
   * @returns Early redemption result with fees and net proceeds
   */
  static simulateEarlyRedemption(
    bond: Bond,
    amount: number,
    redemptionMonth: number,
    inflationRate = 0
  ): EarlyRedemptionResult {
    // Validate redemption month
    if (redemptionMonth <= 0 || redemptionMonth >= bond.durationMonths) {
      throw new Error(
        `Redemption month must be between 1 and ${bond.durationMonths - 1}`
      );
    }

    // Run full simulation for simplicity
    // NOTE: This calculates unnecessary months beyond redemptionMonth for long bonds.
    // Could be optimized by adding a maxMonths parameter to simulate() to stop early
    // while preserving original bond.durationMonths for capitalization logic.
    const fullSimulation = this.simulate(bond, amount, inflationRate);
    const valueAtRedemption = fullSimulation.values[redemptionMonth];

    // Calculate gross profit at redemption
    const grossProfit = valueAtRedemption - amount;

    // Calculate early redemption fee
    // Fee is per 100 PLN unit, so we need to scale by amount
    const feeAmount = (bond.earlyRedemptionFee * amount) / 100;

    // Calculate tax on gross profit (before fee)
    const tax = Math.max(0, grossProfit * Constants.TAX_RATE);

    // Net proceeds = Value - Fee - Tax
    const netProceeds = valueAtRedemption - feeAmount - tax;

    // Calculate net profit (what you gained after costs)
    const netProfit = netProceeds - amount;

    return {
      redemptionMonth,
      valueAtRedemption,
      grossProfit,
      earlyRedemptionFee: feeAmount,
      tax,
      netProceeds,
      netProfit,
    };
  }
}

export interface EarlyRedemptionResult {
  redemptionMonth: number;
  valueAtRedemption: number;
  grossProfit: number;
  earlyRedemptionFee: number;
  tax: number;
  netProceeds: number;
  netProfit: number;
}

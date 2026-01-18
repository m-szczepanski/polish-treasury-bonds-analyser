import { Injectable } from '@angular/core';
import { Bond, BondType, Constants } from './constants';

export interface SimulationResult {
  months: number[];
  values: number[];
  totalProfit: number;
  netProfit: number;
}

@Injectable({
  providedIn: 'root',
})
export class BondCalculatorService {
  /**
   * Calculates the value of the investment over time.
   * @param bond The bond type
   * @param amount Initial investment amount
   * @param inflationRate Assumed constant inflation rate for indexed bonds (after 1st year)
   */
  simulate(bond: Bond, amount: number, inflationRate = Constants.INFLATION_RATE): SimulationResult {
    const months: number[] = [];
    const values: number[] = [];
    let currentCapital = amount;
    let accumulatedInterest = 0;

    // Simplified simulation
    // For indexed bonds (COI, EDO), first year is fixed rate, subsequent years are inflation + margin
    const margin = bond.type === BondType.COI ? 1.5 : bond.type === BondType.EDO ? 2.0 : 0;

    for (let m = 0; m <= bond.durationMonths; m++) {
      months.push(m);

      if (m === 0) {
        values.push(currentCapital);
        continue;
      }

      // Interest calculation logic
      // 1. Monthly capitalization/payment (ROR, DOR)
      if (bond.capitalizationFreqMonths === 1) {
        const annualRate = bond.interestRate; // Simplified
        const monthlyRate = annualRate / 100 / 12;
        accumulatedInterest += amount * monthlyRate;
        values.push(amount + accumulatedInterest);
      }
      // 2. Annual capitalization (TOS, EDO) or Payment (COI)
      else if (bond.capitalizationFreqMonths === 12) {
        if (m % 12 === 0) {
          const year = m / 12;
          let rate = bond.interestRate;

          if (bond.isIndexedToInflation && year > 1) {
            rate = inflationRate + margin;
          }

          const annualInterest = currentCapital * (rate / 100);

          if (bond.type === BondType.COI) {
            accumulatedInterest += annualInterest;
          } else {
            currentCapital += annualInterest;
          }
        }
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
  simulateEarlyRedemption(
    bond: Bond,
    amount: number,
    redemptionMonth: number,
    inflationRate = Constants.INFLATION_RATE
  ): EarlyRedemptionResult {
    if (redemptionMonth <= 0 || redemptionMonth >= bond.durationMonths) {
      throw new Error(
        `Redemption month must be between 1 and ${bond.durationMonths - 1}`
      );
    }

    const fullSimulation = this.simulate(bond, amount, inflationRate);
    const valueAtRedemption = fullSimulation.values[redemptionMonth];

    const grossProfit = valueAtRedemption - amount;
    const feeAmount = (bond.earlyRedemptionFee * amount) / 100;
    const tax = Math.max(0, grossProfit * Constants.TAX_RATE);
    const netProceeds = valueAtRedemption - feeAmount - tax;
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

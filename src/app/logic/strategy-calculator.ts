import { Injectable } from '@angular/core';
import { BondCalculatorService, SimulationResult } from './bond-calculator';
import { Bond, Constants } from './constants';

export interface StrategyRequest {
    bond: Bond;
    initialAmount: number;
    recurringAmount: number;
    frequencyMonths: number;
    durationMonths: number;
    inflationRate: number;
    reinvest: boolean;
}

export interface StrategyResult {
    months: number[];
    totalInvested: number[];
    totalValue: number[];
    totalProfit: number;
    netProfit: number;
}

@Injectable({
    providedIn: 'root'
})
export class StrategyCalculatorService {
    constructor(private bondCalculator: BondCalculatorService) { }

    /**
     * Simulates an investment strategy over the requested duration.
     * The strategy is modeled as a series of investment “tranches”. Each tranche
     * represents a single contribution (initial or recurring) that is invested
     * into the given bond and then simulated independently using
     * {@link BondCalculatorService}. Tranches are created as follows:
     *
     * - At month 0, the `initialAmount` (if > 0) is invested as the first tranche.
     * - For each subsequent month up to `durationMonths`, a new tranche is
     *   created whenever the month is a multiple of `frequencyMonths` and
     *   `recurringAmount` > 0.
     * - If `reinvest` is enabled, coupon payments and/or matured proceeds from
     *   existing tranches may be treated as new contributions, effectively
     *   creating additional reinvestment tranches over time.
     *
     * The per‑tranche bond simulations incorporate any bond‑specific behavior
     * such as interest accrual, tax treatment, indexation, and early redemption
     * rules via the underlying {@link BondCalculatorService}. This method
     * aggregates the individual tranche simulations month by month to produce:
     *
     * - The timeline of simulated months.
     * - The cumulative amount invested by those months (nominal contributions,
     *   before profit/tax).
     * - The total portfolio value, including principal and any reinvested
     *   returns.
     * - The gross profit (total value minus total invested).
     * - The net profit after any taxes or early‑redemption effects included in
     *   the tranche simulations.
     *
     * Input validation ensures:
     * - `durationMonths` is non‑negative.
     * - If `recurringAmount` > 0, then `frequencyMonths` must be positive.
     * - `initialAmount` and `recurringAmount` must be non‑negative.
     *
     * @param request Configuration of the investment strategy to simulate.
     * @param request.bond The bond definition used for each tranche simulation.
     * @param request.initialAmount The amount invested at month 0.
     * @param request.recurringAmount The amount invested at each recurring
     *   contribution date (every `frequencyMonths`), if greater than zero.
     * @param request.frequencyMonths The interval, in months, between recurring
     *   contributions. Must be positive when `recurringAmount` > 0.
     * @param request.durationMonths Total duration of the strategy, in months,
     *   from the initial investment.
     * @param request.inflationRate Annual inflation rate (as a fraction) that
     *   may be used to adjust values within the underlying bond simulations.
     * @param request.reinvest Whether returns (e.g., coupons, matured principal)
     *   are reinvested into new tranches when possible.
     *
     * @returns A {@link StrategyResult} containing the month‑by‑month timeline
     *   of total invested capital, total portfolio value, and aggregated gross
     *   and net profit across all tranches.
     */
    simulate(request: StrategyRequest): StrategyResult {
        if (request.durationMonths < 0) {
            throw new Error('Duration must be non-negative');
        }
        if (request.recurringAmount > 0 && request.frequencyMonths <= 0) {
            throw new Error('Frequency must be positive if recurring amount is positive');
        }
        if (request.initialAmount < 0 || request.recurringAmount < 0) {
            throw new Error('Investment amounts must be non-negative');
        }

        const totalMonths = request.durationMonths;
        const months: number[] = [];
        const totalInvested: number[] = [];
        const totalValue: number[] = [];

        interface Tranche {
            startMonth: number;
            amount: number;
            simulation: SimulationResult;
            isReinvestment: boolean;
        }

        const tranches: Tranche[] = [];

        let runningExternalInvested = 0;
        let cumulativeTaxPaid = 0;
        let cumulativeCashWallet = 0;

        for (let currentMonth = 0; currentMonth <= totalMonths; currentMonth++) {
            months.push(currentMonth);

            const newTranches: Tranche[] = [];

            for (const tranche of tranches) {
                const maturityMonth = tranche.startMonth + request.bond.durationMonths;
                if (maturityMonth === currentMonth) {
                    const finalGrossValue = tranche.simulation.values[tranche.simulation.values.length - 1];

                    const profit = finalGrossValue - tranche.amount;
                    const tax = Math.max(0, profit * Constants.TAX_RATE);
                    cumulativeTaxPaid += tax;
                    const netPayout = finalGrossValue - tax;

                    if (request.reinvest && currentMonth < totalMonths) {
                        const sim = this.bondCalculator.simulate(request.bond, netPayout, request.inflationRate);
                        newTranches.push({ startMonth: currentMonth, amount: netPayout, simulation: sim, isReinvestment: true });
                    } else {
                        cumulativeCashWallet += netPayout;
                    }
                }
            }

            tranches.push(...newTranches);

            let newExternal = 0;
            if (currentMonth === 0) newExternal += request.initialAmount;
            if (currentMonth < totalMonths && currentMonth % request.frequencyMonths === 0 && request.recurringAmount > 0) {
                newExternal += request.recurringAmount;
            }

            if (newExternal > 0) {
                runningExternalInvested += newExternal;
                const sim = this.bondCalculator.simulate(request.bond, newExternal, request.inflationRate);
                tranches.push({ startMonth: currentMonth, amount: newExternal, simulation: sim, isReinvestment: false });
            }
            totalInvested.push(runningExternalInvested);

            let monthlySum = cumulativeCashWallet;

            for (const tranche of tranches) {
                if (currentMonth < tranche.startMonth) continue;

                const relativeMonth = currentMonth - tranche.startMonth;
                const maturityMonth = tranche.startMonth + request.bond.durationMonths;

                if (currentMonth < maturityMonth) {
                    monthlySum += tranche.simulation.values[relativeMonth];
                }
            }

            totalValue.push(monthlySum);
        }

        let finalLiquidationValue = cumulativeCashWallet;

        for (const tranche of tranches) {
            const finalMonth = totalMonths;
            if (finalMonth < tranche.startMonth) continue;

            const maturityMonth = tranche.startMonth + request.bond.durationMonths;
            if (finalMonth < maturityMonth) {
                const relativeMonth = finalMonth - tranche.startMonth;
                if (relativeMonth > 0) {
                    const earlyResult = this.bondCalculator.simulateEarlyRedemption(request.bond, tranche.amount, relativeMonth, request.inflationRate);
                    finalLiquidationValue += earlyResult.netProceeds;
                    cumulativeTaxPaid += earlyResult.tax;
                } else {
                    finalLiquidationValue += tranche.amount;
                }
            }
        }

        if (totalValue.length > 0) {
            totalValue[totalValue.length - 1] = finalLiquidationValue;
        }

        const netProfit = finalLiquidationValue - runningExternalInvested;
        const totalProfit = netProfit + cumulativeTaxPaid;

        return {
            months,
            totalInvested,
            totalValue,
            totalProfit,
            netProfit
        };
    }
}

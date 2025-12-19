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
     * Simulates an investment strategy over a specified duration, handling tranches, reinvestment, tax calculations, and early redemption.
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

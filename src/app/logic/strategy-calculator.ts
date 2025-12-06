import { BondCalculator, SimulationResult } from './bond-calculator';
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

export class StrategyCalculator {
    static simulate(request: StrategyRequest): StrategyResult {
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

        for (let m = 0; m <= totalMonths; m++) {
            months.push(m);

            for (const tranche of tranches) {
                const maturityMonth = tranche.startMonth + request.bond.durationMonths;
                if (maturityMonth === m) {
                    const finalGrossValue = tranche.simulation.values[tranche.simulation.values.length - 1];

                    const profit = finalGrossValue - tranche.amount;
                    const tax = Math.max(0, profit * Constants.TAX_RATE);
                    cumulativeTaxPaid += tax;
                    const netPayout = finalGrossValue - tax;

                    if (request.reinvest && m < totalMonths) {
                        const sim = BondCalculator.simulate(request.bond, netPayout, request.inflationRate);
                        tranches.push({ startMonth: m, amount: netPayout, simulation: sim, isReinvestment: true });
                    } else {
                        cumulativeCashWallet += netPayout;
                    }
                }
            }

            let newExternal = 0;
            if (m === 0) newExternal += request.initialAmount;
            if (m < totalMonths) {
                if (m > 0 && m % request.frequencyMonths === 0) newExternal += request.recurringAmount;
                else if (m === 0 && request.recurringAmount > 0 && request.initialAmount === 0) newExternal += request.recurringAmount;
            }

            if (newExternal > 0) {
                runningExternalInvested += newExternal;
                const sim = BondCalculator.simulate(request.bond, newExternal, request.inflationRate);
                tranches.push({ startMonth: m, amount: newExternal, simulation: sim, isReinvestment: false });
            }
            totalInvested.push(runningExternalInvested);

            let monthlySum = cumulativeCashWallet;

            for (const tranche of tranches) {
                if (m < tranche.startMonth) continue;

                const relativeMonth = m - tranche.startMonth;
                const maturityMonth = tranche.startMonth + request.bond.durationMonths;

                if (m < maturityMonth) {
                    monthlySum += tranche.simulation.values[relativeMonth];
                }
            }

            totalValue.push(monthlySum);
        }

        let finalLiquidationValue = cumulativeCashWallet;

        for (const tranche of tranches) {
            const m = totalMonths;
            if (m < tranche.startMonth) continue;

            const maturityMonth = tranche.startMonth + request.bond.durationMonths;
            if (m < maturityMonth) {
                const relativeMonth = m - tranche.startMonth;
                if (relativeMonth > 0) {
                    const earlyResult = BondCalculator.simulateEarlyRedemption(request.bond, tranche.amount, relativeMonth, request.inflationRate);
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
            totalProfit: totalProfit,
            netProfit: netProfit
        };
    }
}

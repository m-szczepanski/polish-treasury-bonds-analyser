import { BondCalculator } from './bond-calculator';
import { Bond } from './constants';

export interface StrategyRequest {
    bond: Bond;
    initialAmount: number;
    recurringAmount: number; // Amount to invest at each interval
    frequencyMonths: number; // e.g. 1 for monthly, 3 for quarterly
    durationMonths: number;
    inflationRate: number;
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

        // We will track multiple bond simulations.
        // Each investment creates a "tranche" or "batch" that runs its own simulation effectively.
        // However, running hundreds of simulations might be heavy if not optimized, 
        // but for < 1000 data points it's fine.

        // Actually, we can reuse BondCalculator.simulate but we need to handle the time offset.
        // BondCalculator.simulate returns arrays [0...duration].
        // If we buy a bond at month k, its month 0 corresponds to strategy month k.
        // Value at strategy month m (where m >= k) is result.values[m - k].

        // Optimization: Pre-calculate one standard simulation for the bond type 
        // for the max possible duration (totalMonths). 
        // Then scaling it by amount is trivial if the bond parameters (rate) are constant.
        // Constant interestRate is an assumption here. (For EDO/COI inflation applies same way).

        // NOTE: If interest rates changed over time this would be complex. 
        // With constant assumption, we can just simulate once for 1 PLN unit.

        // BUT, BondCalculator.simulate takes 'amount' and applies rounding/taxes potentially?
        // Let's assume linear scaling for simplicity or run separate simulations if perf allows.
        // Let's run separate simulations for correctness with rounding if any.
        // Actually, BondCalculator is static and fast.

        const tranches: { startMonth: number; simulationValues: number[] }[] = [];

        let currentInvested = 0;

        // 1. Create tranches
        for (let m = 0; m < totalMonths; m++) {
            let amountToInvest = 0;

            if (m === 0) {
                amountToInvest += request.initialAmount;
            }

            // Check for recurring investment
            // If frequency is 1, invest at 0, 1, 2...
            // If frequency is 12, invest at 0, 12, 24...
            // Standard: usually we invest at month 0 (initial), and then recurring starts at month 1? 
            // Or does initial replace the first recurring?
            // Let's assume: Initial is at T0. Recurring starts at T0 + frequency? 
            // Or Recurring happens at T0 too?
            // "Own contribution" usually means T0 extra.
            // Let's say: T0 gets Initial + Recurring (if aligned)? 
            // Usually user thinks: "I start with X, and then every month I add Y".
            // So T0: Initial. T1..n: Recurring?
            // Or T0: Initial. T1 (next month) starts recurring?
            // Let's assume recurring starts at month 1 if frequency is 1 month.
            // Actually, let's treat recurring as "every X months starting from month 0 or month freq?"
            // Simple interpretation:
            // Month 0: Initial Amount.
            // Month 0 + freq, 0 + 2*freq... : Recurring Amount.

            if (m > 0 && m % request.frequencyMonths === 0) {
                amountToInvest += request.recurringAmount;
            } else if (m === 0 && request.recurringAmount > 0 && request.initialAmount === 0) {
                // If no initial amount, maybe the first recurring payment is at 0?
                // Let's stick to strict:
                // Initial is T0.
                // Recurring sequence is T0, Tf, T2f...
                // If user inputs Initial=1000, Recurring=500, Freq=1.
                // T0: 1000 + 500? Or just 1000? 
                // Let's assume independent streams.
                // Stream 1: Initial at T0.
                // Stream 2: Recurring at T0, Tf, T2f... 
                amountToInvest += request.recurringAmount;
            }

            if (amountToInvest > 0) {
                // Calculate how long this bond will run within the strategy duration
                // It runs until totalMonths. 
                // Note: BondCalculator simulates up to bond.duration. 
                // If strategy is 10 years, and we buy a 3-month bond at month 118, 
                // it matures at 121 (beyond strategy). 
                // We need values up to totalMonths.
                // BondCalculator needs to support simulation up to N months?
                // Or we just take what we need.

                // However, BondCalculator currently simulates exactly for bond.durationMonths.
                // If bond ends, cash is held? Or reinvested?
                // Assumption from plan: "Accumulate payouts as cash".
                // If a bond matures (e.g. OTS 3-month), at month 3 we get cash. 
                // Does it get reinvested? User didn't say.
                // PLAN SAYS: "I will assume 'reinvestment' of payouts is NOT automatic... Accumulate payouts as cash."
                // This implies manual reinvestment is not auto.
                // So if I buy OTS (3-mo) at month 0. At month 3 it matures. Value is Principal + Interest.
                // At month 4, I just hold that cash (0% interest)? That's a bad strategy but accurate to "no auto reinvest".

                // Wait, if I select OTS for a 10 year strategy, I probably imply rolling it over?
                // "Rolling over" is standard for short term bonds in a long strategy.
                // If I buy COI (4-year) in a 10 year strategy... at year 4 it ends.
                // If I don't reinvest, it's just cash.
                // Let's implement NO AUTO REINVEST first as per plan.

                // BondCalculator simulates for its duration.
                const simResult = BondCalculator.simulate(request.bond, amountToInvest, request.inflationRate);
                tranches.push({ startMonth: m, simulationValues: simResult.values });
                currentInvested += amountToInvest;
            }
        }

        // 2. Aggregate
        for (let m = 0; m <= totalMonths; m++) {
            let monthlyTotalValue = 0;
            let monthlyInvested = 0; // We can track cumulative invested precisely

            // Calculate cumulative invested up to this month
            // (Simple approach: loop tranches)
            // Optimization: Pre-calculate invested array?
            // Just iterating is fine for N=120.

            for (const tranche of tranches) {
                if (tranche.startMonth > m) continue;

                // If we are past the start of this tranche
                const relativeMonth = m - tranche.startMonth;

                // Check if tranche is still active or ended
                // simResult.values has length duration + 1. 0..duration.
                if (relativeMonth < tranche.simulationValues.length) {
                    monthlyTotalValue += tranche.simulationValues[relativeMonth];
                } else {
                    // Bond matured/ended. We hold the final value as cash.
                    // Last value in array is the payout/maturity value.
                    monthlyTotalValue += tranche.simulationValues[tranche.simulationValues.length - 1];
                }
            }

            // Calculate cumulative invested
            // This can be simpler: just sum all investments that happened slice <= m
            // We can optimize outside the loop

            months.push(m);
            totalValue.push(monthlyTotalValue);
        }

        // Re-calculate invested array properly
        let runningInvested = 0;
        for (let m = 0; m <= totalMonths; m++) {
            // Add investments happening at this month
            // (Re-using logic from loop 1 to know when investment happened is messy)
            // Let's cleaner loop:
            let investedThisMonth = 0;
            if (m === 0) investedThisMonth += request.initialAmount;

            // Recurring rule:
            // Logic duplicate of loop 1. 
            // Let's refine the recurring rule clearly:
            // Initial: T0.
            // Recurring: T0, T0+freq, ...

            // Actually, let's fix the rule in step 1 to be:
            // T0: always Initial.
            // Recurring: T0 + k*freq.
            // BUT, if Initial > 0 and Recurring > 0, do we double invest at T0?
            // Usually "Initial investment" is the total start sum.
            // "Monthly contribution" starts next month?
            // Let's assume:
            // T0: Initial Amount.
            // T1, T2... (or T_freq_): Recurring.
            // Only if Initial is 0, we treat first Recurring as start?
            // Let's stick to: Recurring starts at T_freq.

            // Investment only happens strictly before the end month (0 to totalMonths - 1)
            if (m < totalMonths) {
                if (m > 0 && m % request.frequencyMonths === 0) {
                    investedThisMonth += request.recurringAmount;
                } else if (m === 0 && request.recurringAmount > 0 && request.initialAmount === 0) {
                    investedThisMonth += request.recurringAmount;
                }
            }

            runningInvested += investedThisMonth;
            totalInvested.push(runningInvested);
        }

        const finalValue = totalValue[totalValue.length - 1];
        const finalInvested = totalInvested[totalInvested.length - 1];
        const grossProfit = finalValue - finalInvested;
        // Net profit calculation is complex because tax is per bond.
        // We simulated gross values. 
        // We should sum up NET profits from each tranche.
        // Correct way: The Total Value graph usually shows Gross.
        // Summaries show Net.
        // Let's calculate Net Profit by summing net profits of matured/ended tranches + current accrued net of active ones?
        // BondCalculator provides `netProfit` for full duration.
        // For active bonds, we can estimate tax on accrued.
        // StrategyResult needs a number for "Net Profit" at the end.

        // Let's approximate: Tax on total gain?
        // Accurate: Sum of (Value - Invested) * 0.81? 
        // No, tax is on positive gain only.
        // Each bond behaves independently.

        // Let's rely on simple tax on total gain for now for the aggregate, 
        // OR calling simulate() on tranches again to get net? 
        // Actually BondCalculator.simulate returns final netProfit.

        // Let's assume standard tax rule on the total strategy gain is acceptable for this view?
        // Or better: (FinalValue - Invested) * 0.81 (if gain > 0).
        const tax = Math.max(0, grossProfit * 0.19);
        const netProfit = grossProfit - tax;

        return {
            months,
            totalInvested,
            totalValue,
            totalProfit: grossProfit,
            netProfit
        };
    }
}

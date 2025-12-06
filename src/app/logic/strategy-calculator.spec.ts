import { StrategyCalculator, StrategyRequest } from './strategy-calculator';
import { BondType, Constants } from './constants';

describe('StrategyCalculator', () => {
    const otsBond = Constants.BONDS.find(b => b.type === BondType.OTS)!;
    const tosBond = Constants.BONDS.find(b => b.type === BondType.TOS)!;

    it('should handle single initial investment correctly (no recurring)', () => {
        const result = StrategyCalculator.simulate({
            bond: otsBond,
            initialAmount: 1000,
            recurringAmount: 0,
            frequencyMonths: 1,
            durationMonths: 13,
            inflationRate: 0
        });

        // Duration 1 year = 12 months.
        // OTS is 3 months.
        // It should run for 3 months, then stay flat as cash (per current logic assumption).
        // Or if we implemented auto-reinvest? No, logic says "hold as cash".

        expect(result.months.length).toBe(13); // 0 to 12
        expect(result.totalInvested[0]).toBe(1000);
        expect(result.totalInvested[12]).toBe(1000);

        // Check value at month 3 (maturity)
        // 1000 * 3/12 * 2.5% approx
        // 1000 + 6.25 roughly?
        // Using real calculator values
        expect(result.totalValue[3]).toBeGreaterThan(1000);
        expect(result.totalValue[12]).toBe(result.totalValue[3]); // Cash held
    });

    it('should handle recurring investment only', () => {
        const request: StrategyRequest = {
            bond: otsBond,
            initialAmount: 0,
            recurringAmount: 1000,
            frequencyMonths: 1, // Monthly
            durationMonths: 12,
            inflationRate: 0
        };

        const result = StrategyCalculator.simulate(request);

        // T0: 0 invested (Recurring starts usually next month? Or current? Logic says: if m>0 && m%freq==0... )
        // Wait, my logic: 
        // if (m > 0 && m % freq === 0) -> Invest.
        // if (m === 0 && recurring > 0 && initial === 0) -> Invest?
        // Let's check logic:
        // } else if (m === 0 && request.recurringAmount > 0 && request.initialAmount === 0) {
        //    amountToInvest += request.recurringAmount;
        // }
        // So if Initial=0, we invest at T0.

        expect(result.totalInvested[0]).toBe(1000);
        expect(result.totalInvested[1]).toBe(2000);
        expect(result.totalInvested[12]).toBe(12000); // 0..11 is 12 points (months 0 to 11). Month 12 is end.

        // Value should be accumulating
        expect(result.totalValue[12]).toBeGreaterThan(12000);
    });

    it('should handle initial + recurring investment', () => {
        const request: StrategyRequest = {
            bond: otsBond,
            initialAmount: 10000,
            recurringAmount: 1000,
            frequencyMonths: 1,
            durationMonths: 12,
            inflationRate: 0
        };

        const result = StrategyCalculator.simulate(request);

        // T0: 10000
        // T1: 10000 + 1000 = 11000
        expect(result.totalInvested[0]).toBe(10000);
        expect(result.totalInvested[1]).toBe(11000);

        // Total invested at m=12 should be Initial + 11 monthly payments (T1...T11)
        expect(result.totalInvested[12]).toBe(21000);
    });

    it('should handle quarterly frequency', () => {
        const request: StrategyRequest = {
            bond: otsBond,
            initialAmount: 1000,
            recurringAmount: 1000,
            frequencyMonths: 3,
            durationMonths: 12,
            inflationRate: 0
        };

        const result = StrategyCalculator.simulate(request);

        // T0: 1000 (Initial)
        // T3: 2000
        // T6: 3000
        // T9: 4000
        // T12: End date, no new investment.

        expect(result.totalInvested[0]).toBe(1000);
        expect(result.totalInvested[1]).toBe(1000);
        expect(result.totalInvested[3]).toBe(2000);
        expect(result.totalInvested[12]).toBe(4000);
    });

    it('should accumulate value correctly for overlapping bonds (TOS)', () => {
        // TOS is 3 years. Strategy 1 year.
        // Bonds won't finish.
        const request: StrategyRequest = {
            bond: tosBond,
            initialAmount: 1000,
            recurringAmount: 1000,
            frequencyMonths: 6,
            durationMonths: 12, // 12 months
            inflationRate: 0
        };

        const result = StrategyCalculator.simulate(request);

        // T0: Buy TOS 1000.
        // T6: Buy TOS 1000.
        // T12: Buy TOS 1000.

        // At T12:
        // Tranche 1 (T0): Has run for 12 months. Value = 1000 (TOS caps annually, so flat until 12, at 12 jumps?)
        // TOS logic: m%12===0 -> Capitalize.
        // At month 12, Tranche 1 Capitalizes. Value > 1000.
        // Tranche 2 (T6): Has run for 6 months. Value = 1000.
        // Tranche 3 (T12): Has run for 0 months. Value = 1000.

        // Total Value > 3000.

        // BondCalculator simulate returns array. 
        // Tranche 1: values[12] -> is capitalization included?
        // BondCalculator checks (m % 12 === 0). 
        // m=12 match. Logic: if (m % 12 === 0) ... values.push(currentCapital).
        // Yes available at m=12.

        expect(result.totalValue[12]).toBeGreaterThan(2000);
    });
});

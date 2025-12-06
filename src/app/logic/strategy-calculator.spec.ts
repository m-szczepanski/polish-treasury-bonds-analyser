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
            inflationRate: 0,
            reinvest: false
        });

        expect(result.months.length).toBe(14);
        expect(result.totalInvested[0]).toBe(1000);
        expect(result.totalInvested[12]).toBe(1000);
        expect(result.totalValue[3]).toBeGreaterThan(1000);
        expect(result.totalValue[12]).toBe(result.totalValue[3]);
    });

    it('should handle recurring investment only', () => {
        const request: StrategyRequest = {
            bond: otsBond,
            initialAmount: 0,
            recurringAmount: 1000,
            frequencyMonths: 1,
            durationMonths: 12,
            inflationRate: 0,
            reinvest: false
        };

        const result = StrategyCalculator.simulate(request);

        expect(result.totalInvested[0]).toBe(1000);
        expect(result.totalInvested[1]).toBe(2000);
        expect(result.totalInvested[12]).toBe(12000);
        expect(result.totalValue[12]).toBeGreaterThan(12000);
    });

    it('should handle initial + recurring investment', () => {
        const request: StrategyRequest = {
            bond: otsBond,
            initialAmount: 10000,
            recurringAmount: 1000,
            frequencyMonths: 1,
            durationMonths: 12,
            inflationRate: 0,
            reinvest: false
        };

        const result = StrategyCalculator.simulate(request);

        expect(result.totalInvested[0]).toBe(10000);
        expect(result.totalInvested[1]).toBe(11000);
        expect(result.totalInvested[12]).toBe(21000);
        expect(result.totalInvested[12]).toBe(21000);
    });

    it('should handle quarterly frequency', () => {
        const request: StrategyRequest = {
            bond: otsBond,
            initialAmount: 1000,
            recurringAmount: 1000,
            frequencyMonths: 3,
            durationMonths: 12,
            inflationRate: 0,
            reinvest: false
        };

        const result = StrategyCalculator.simulate(request);

        expect(result.totalInvested[0]).toBe(1000);
        expect(result.totalInvested[1]).toBe(1000);
        expect(result.totalInvested[3]).toBe(2000);
        expect(result.totalInvested[12]).toBe(4000);
    });

    it('should accumulate value correctly for overlapping bonds (TOS)', () => {
        const request: StrategyRequest = {
            bond: tosBond,
            initialAmount: 1000,
            recurringAmount: 1000,
            frequencyMonths: 6,
            durationMonths: 12,
            inflationRate: 0,
            reinvest: false
        };

        const result = StrategyCalculator.simulate(request);

        expect(result.totalValue[12]).toBeGreaterThan(2000);
    });
});

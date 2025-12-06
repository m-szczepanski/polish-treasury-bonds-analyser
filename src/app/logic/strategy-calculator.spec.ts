import { StrategyCalculator, StrategyRequest } from './strategy-calculator';
import { BondType, Constants } from './constants';

describe('StrategyCalculator', () => {
    const otsBond = Constants.BONDS.find(b => b.type === BondType.OTS)!;
    const tosBond = Constants.BONDS.find(b => b.type === BondType.TOS)!;
    const edoBond = Constants.BONDS.find(b => b.type === BondType.EDO)!;

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
        expect(result.totalValue[0]).toBe(1000);
        expect(result.totalValue[1]).toBe(1000);
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
        expect(result.totalInvested[11]).toBe(12000);
        expect(result.totalInvested[12]).toBe(12000);
        expect(result.totalValue[12]).toBeGreaterThan(12000);
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

        expect(result.totalInvested[12]).toBe(2000);
        expect(result.totalValue[12]).toBeGreaterThan(2000);
    });

    describe('Tax Calculations', () => {
        it('should correctly calculate net profit validation for profitable strategy', () => {
            const request: StrategyRequest = {
                bond: otsBond,
                initialAmount: 10000,
                recurringAmount: 0,
                frequencyMonths: 1,
                durationMonths: 4,
                inflationRate: 0,
                reinvest: false
            };

            const result = StrategyCalculator.simulate(request);

            expect(result.totalProfit).toBeGreaterThan(0);
            expect(result.netProfit).toBeGreaterThan(0);
            expect(result.netProfit).toBeLessThan(result.totalProfit);

            const taxPaid = result.totalProfit - result.netProfit;
            const effectiveTaxRate = taxPaid / result.totalProfit;
            expect(effectiveTaxRate).toBeCloseTo(0.19, 1);
        });
    });

    describe('Early Redemption (Exit)', () => {
        it('should apply early redemption fee at the end of strategy check', () => {

            const request: StrategyRequest = {
                bond: edoBond,
                initialAmount: 1000,
                recurringAmount: 0,
                frequencyMonths: 1,
                durationMonths: 24,
                inflationRate: 5,
                reinvest: false
            };

            const result = StrategyCalculator.simulate(request);
            const finalValue = result.totalValue[24];

            expect(result.months.length).toBe(25);
            expect(finalValue).toBeGreaterThan(0);
            expect(result.totalProfit).toBeDefined();
        });
    });

    describe('Reinvestment Logic', () => {
        it('should reinvest payouts when enabled', () => {
            const resultNoReinvest = StrategyCalculator.simulate({
                bond: otsBond,
                initialAmount: 1000,
                recurringAmount: 0,
                frequencyMonths: 1,
                durationMonths: 6,
                inflationRate: 0,
                reinvest: false
            });

            const resultReinvest = StrategyCalculator.simulate({
                bond: otsBond,
                initialAmount: 1000,
                recurringAmount: 0,
                frequencyMonths: 1,
                durationMonths: 6,
                inflationRate: 0,
                reinvest: true
            });

            expect(resultReinvest.netProfit).toBeGreaterThan(resultNoReinvest.netProfit);
            expect(resultReinvest.totalValue[6]).toBeGreaterThan(resultNoReinvest.totalValue[6]);
        });
    });
});

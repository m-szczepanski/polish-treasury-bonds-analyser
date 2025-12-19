import { BondCalculator } from './bond-calculator';
import { Bond, BondType, Constants } from './constants';

describe('BondCalculator', () => {
    describe('simulate', () => {
        describe('OTS - 3-month bond with capitalization at maturity', () => {
            const otsBond: Bond = {
                type: BondType.OTS,
                name: 'OTS - 3-miesięczne',
                description: 'Test OTS',
                interestRate: 4.0, // 4% annual
                durationMonths: 3,
                isIndexedToInflation: false,
                capitalizationFreqMonths: 0,
                earlyRedemptionFee: 0,
            };

            it('should calculate correct value for 1000 PLN investment', () => {
                const result = BondCalculator.simulate(otsBond, 1000);

                // Month 0: 1000
                expect(result.months[0]).toBe(0);
                expect(result.values[0]).toBe(1000);

                // Months 1-2: should stay at 1000 (no capitalization yet)
                expect(result.values[1]).toBe(1000);
                expect(result.values[2]).toBe(1000);

                // Month 3: should have interest capitalized
                // Interest = 1000 * 0.04 * (3/12) = 10
                const expectedFinalValue = 1000 + 10;
                expect(result.values[3]).toBe(expectedFinalValue);

                // Total profit
                expect(result.totalProfit).toBe(10);

                // Net profit after 19% tax
                const tax = 10 * Constants.TAX_RATE;
                expect(result.netProfit).toBeCloseTo(10 - tax, 2);
            });

            it('should calculate correct value for 5000 PLN investment', () => {
                const result = BondCalculator.simulate(otsBond, 5000);

                // Interest = 5000 * 0.04 * (3/12) = 50
                const expectedProfit = 50;
                const expectedTax = expectedProfit * Constants.TAX_RATE;

                expect(result.totalProfit).toBe(expectedProfit);
                expect(result.netProfit).toBeCloseTo(expectedProfit - expectedTax, 2);
            });
        });

        describe('ROR - 1-year bond with monthly payments', () => {
            const rorBond: Bond = {
                type: BondType.ROR,
                name: 'ROR - Roczne',
                description: 'Test ROR',
                interestRate: 6.0, // 6% annual
                durationMonths: 12,
                isIndexedToInflation: false,
                capitalizationFreqMonths: 1,
                earlyRedemptionFee: 0.5,
            };

            it('should accumulate monthly interest payments correctly', () => {
                const result = BondCalculator.simulate(rorBond, 1000);

                // Month 0: 1000
                expect(result.values[0]).toBe(1000);

                // Monthly rate = 6% / 12 = 0.5% = 0.005
                const monthlyRate = 0.06 / 12;

                // After month 1: 1000 + (1000 * 0.005) = 1005
                expect(result.values[1]).toBeCloseTo(1000 + 1000 * monthlyRate, 2);

                // After month 2: 1000 + (1000 * 0.005 * 2) = 1010
                expect(result.values[2]).toBeCloseTo(1000 + 1000 * monthlyRate * 2, 2);

                // After month 12: 1000 + (1000 * 0.005 * 12) = 1000 + 60 = 1060
                expect(result.values[12]).toBeCloseTo(1060, 2);

                // Total profit should be ~60
                expect(result.totalProfit).toBeCloseTo(60, 2);

                // Net profit after 19% tax
                const tax = 60 * Constants.TAX_RATE;
                expect(result.netProfit).toBeCloseTo(60 - tax, 2);
            });

            it('should handle different investment amounts', () => {
                const result = BondCalculator.simulate(rorBond, 10000);

                // Total interest = 10000 * 0.06 = 600
                expect(result.totalProfit).toBeCloseTo(600, 2);

                const tax = 600 * Constants.TAX_RATE;
                expect(result.netProfit).toBeCloseTo(600 - tax, 2);
            });
        });

        describe('TOS - 3-year bond with annual capitalization', () => {
            const tosBond: Bond = {
                type: BondType.TOS,
                name: 'TOS - 3-letnie',
                description: 'Test TOS',
                interestRate: 5.0, // 5% annual
                durationMonths: 36,
                isIndexedToInflation: false,
                capitalizationFreqMonths: 12,
                earlyRedemptionFee: 0.7,
            };

            it('should calculate compound interest with annual capitalization', () => {
                const result = BondCalculator.simulate(tosBond, 1000);

                // Month 0: 1000
                expect(result.values[0]).toBe(1000);

                // Months 1-11: should stay at 1000
                for (let i = 1; i < 12; i++) {
                    expect(result.values[i]).toBe(1000);
                }

                // Month 12 (Year 1): 1000 * 1.05 = 1050
                expect(result.values[12]).toBeCloseTo(1050, 2);

                // Month 24 (Year 2): 1050 * 1.05 = 1102.5
                expect(result.values[24]).toBeCloseTo(1102.5, 2);

                // Month 36 (Year 3): 1102.5 * 1.05 = 1157.625
                expect(result.values[36]).toBeCloseTo(1157.625, 2);

                // Total profit
                const expectedProfit = 1157.625 - 1000;
                expect(result.totalProfit).toBeCloseTo(expectedProfit, 2);

                // Net profit after tax
                const tax = expectedProfit * Constants.TAX_RATE;
                expect(result.netProfit).toBeCloseTo(expectedProfit - tax, 2);
            });
        });

        describe('COI - 4-year inflation-indexed bond with annual payments', () => {
            const coiBond: Bond = {
                type: BondType.COI,
                name: 'COI - 4-letnie',
                description: 'Test COI',
                interestRate: 5.0, // First year fixed
                durationMonths: 48,
                isIndexedToInflation: true,
                capitalizationFreqMonths: 12,
                earlyRedemptionFee: 0.7,
            };

            it('should use fixed rate for year 1, then inflation + margin', () => {
                const inflation = 3.0; // Assume 3% inflation
                const result = BondCalculator.simulate(coiBond, 1000, inflation);

                // Month 0: 1000
                expect(result.values[0]).toBe(1000);

                // Year 1 (month 12): 1000 + (1000 * 0.05) = 1000 + 50 = 1050
                // COI pays interest, doesn't capitalize
                expect(result.values[12]).toBeCloseTo(1050, 2);

                // Year 2 (month 24): should use inflation + margin (1.5% for COI)
                // Rate = 3% + 1.5% = 4.5%
                // Interest = 1000 * 0.045 = 45
                // Total = 1000 + 50 + 45 = 1095
                expect(result.values[24]).toBeCloseTo(1095, 2);

                // Year 3 (month 36): Interest = 1000 * 0.045 = 45
                // Total = 1000 + 50 + 45 + 45 = 1140
                expect(result.values[36]).toBeCloseTo(1140, 2);

                // Year 4 (month 48): Interest = 1000 * 0.045 = 45
                // Total = 1000 + 50 + 45 + 45 + 45 = 1185
                expect(result.values[48]).toBeCloseTo(1185, 2);

                // Total profit
                expect(result.totalProfit).toBeCloseTo(185, 2);
            });

            it('should adapt to different inflation rates', () => {
                const highInflation = 8.0; // 8% inflation
                const result = BondCalculator.simulate(coiBond, 1000, highInflation);

                // Year 1: 50 (fixed 5%)
                // Year 2: 1000 * (8% + 1.5%) = 95
                // Year 3: 1000 * 9.5% = 95
                // Year 4: 1000 * 9.5% = 95
                // Total profit = 50 + 95 + 95 + 95 = 335

                expect(result.totalProfit).toBeCloseTo(335, 2);
            });
        });

        describe('EDO - 10-year inflation-indexed bond with annual capitalization', () => {
            const edoBond: Bond = {
                type: BondType.EDO,
                name: 'EDO - 10-letnie',
                description: 'Test EDO',
                interestRate: 6.0, // First year fixed
                durationMonths: 120,
                isIndexedToInflation: true,
                capitalizationFreqMonths: 12,
                earlyRedemptionFee: 2.0,
            };

            it('should capitalize interest annually with inflation indexing', () => {
                const inflation = 4.0; // 4% inflation
                const result = BondCalculator.simulate(edoBond, 1000, inflation);

                // Month 0: 1000
                expect(result.values[0]).toBe(1000);

                // Year 1 (month 12): 1000 * 1.06 = 1060
                expect(result.values[12]).toBeCloseTo(1060, 2);

                // Year 2 (month 24): rate = 4% + 2% (EDO margin) = 6%
                // 1060 * 1.06 = 1123.6
                expect(result.values[24]).toBeCloseTo(1123.6, 2);

                // Year 3 (month 36): 1123.6 * 1.06 = 1191.016
                expect(result.values[36]).toBeCloseTo(1191.016, 2);

                // Verify total profit is positive
                expect(result.totalProfit).toBeGreaterThan(0);
                expect(result.netProfit).toBeGreaterThan(0);
                expect(result.netProfit).toBeLessThan(result.totalProfit);
            });

            it('should handle the full 10-year duration', () => {
                const inflation = 3.0;
                const result = BondCalculator.simulate(edoBond, 10000, inflation);

                // Should have 121 data points (0 to 120 months)
                expect(result.months.length).toBe(121);
                expect(result.values.length).toBe(121);

                // Final value should be greater than initial
                expect(result.values[120]).toBeGreaterThan(10000);

                // Profit should be positive
                expect(result.totalProfit).toBeGreaterThan(0);
            });
        });

        describe('Tax calculations', () => {
            it('should apply 19% tax rate correctly', () => {
                const bond: Bond = {
                    type: BondType.OTS,
                    name: 'Test',
                    description: 'Test',
                    interestRate: 10.0,
                    durationMonths: 12,
                    isIndexedToInflation: false,
                    capitalizationFreqMonths: 0,
                    earlyRedemptionFee: 0,
                };

                const result = BondCalculator.simulate(bond, 1000);

                // Profit = 1000 * 0.10 * (12/12) = 100
                expect(result.totalProfit).toBeCloseTo(100, 2);

                // Tax = 100 * 0.19 = 19
                const expectedTax = 100 * Constants.TAX_RATE;
                expect(expectedTax).toBeCloseTo(19, 2);

                // Net profit = 100 - 19 = 81
                expect(result.netProfit).toBeCloseTo(81, 2);
            });

            it('should not apply negative tax for losses', () => {
                const bond: Bond = {
                    type: BondType.OTS,
                    name: 'Test',
                    description: 'Test',
                    interestRate: 0.0, // No interest
                    durationMonths: 12,
                    isIndexedToInflation: false,
                    capitalizationFreqMonths: 0,
                    earlyRedemptionFee: 0,
                };

                const result = BondCalculator.simulate(bond, 1000);

                // No profit, no loss
                expect(result.totalProfit).toBe(0);
                expect(result.netProfit).toBe(0);
            });
        });

        describe('Edge cases', () => {
            it('should handle zero investment amount', () => {
                const bond: Bond = Constants.BONDS[0];
                const result = BondCalculator.simulate(bond, 0);

                expect(result.values[0]).toBe(0);
                expect(result.totalProfit).toBe(0);
                expect(result.netProfit).toBe(0);
            });

            it('should handle very small investment amounts', () => {
                const bond: Bond = Constants.BONDS[0];
                const result = BondCalculator.simulate(bond, 1);

                expect(result.values[0]).toBe(1);
                expect(result.totalProfit).toBeGreaterThanOrEqual(0);
            });

            it('should handle very large investment amounts', () => {
                const bond: Bond = Constants.BONDS[0];
                const result = BondCalculator.simulate(bond, 1000000);

                expect(result.values[0]).toBe(1000000);
                expect(result.values[result.values.length - 1]).toBeGreaterThan(1000000);
            });
        });

        describe('Array consistency', () => {
            it('should have matching lengths for months and values arrays', () => {
                const bond: Bond = Constants.BONDS[0];
                const result = BondCalculator.simulate(bond, 1000);

                expect(result.months.length).toBe(result.values.length);
            });

            it('should have correct number of data points', () => {
                const bond: Bond = {
                    type: BondType.OTS,
                    name: 'Test',
                    description: 'Test',
                    interestRate: 5.0,
                    durationMonths: 12,
                    isIndexedToInflation: false,
                    capitalizationFreqMonths: 0,
                    earlyRedemptionFee: 0,
                };

                const result = BondCalculator.simulate(bond, 1000);

                // Should have 13 points (0 through 12)
                expect(result.months.length).toBe(13);
                expect(result.months[0]).toBe(0);
                expect(result.months[12]).toBe(12);
            });

            it('should have monotonically increasing or equal values', () => {
                const bond: Bond = Constants.BONDS[0];
                const result = BondCalculator.simulate(bond, 1000);

                for (let i = 1; i < result.values.length; i++) {
                    expect(result.values[i]).toBeGreaterThanOrEqual(result.values[i - 1]);
                }
            });
        });

        describe('Real bond configurations from Constants', () => {
            it('should calculate correctly for all bonds in Constants.BONDS', () => {
                Constants.BONDS.forEach((bond) => {
                    const result = BondCalculator.simulate(bond, 1000, 5.0);

                    expect(result.months.length).toBe(bond.durationMonths + 1);
                    expect(result.values.length).toBe(bond.durationMonths + 1);
                    expect(result.values[0]).toBe(1000);
                    expect(result.values[bond.durationMonths]).toBeGreaterThanOrEqual(1000);
                    expect(result.netProfit).toBeLessThanOrEqual(result.totalProfit);
                });
            });
        });
    });

    describe('simulateEarlyRedemption', () => {
        describe('Basic early redemption calculations', () => {
            const otsBond: Bond = {
                type: BondType.OTS,
                name: 'OTS Test',
                description: 'Test',
                interestRate: 4.0,
                durationMonths: 3,
                isIndexedToInflation: false,
                capitalizationFreqMonths: 0,
                earlyRedemptionFee: 0, // No fee for OTS
            };

            it('should calculate early redemption correctly for bond with no fee', () => {
                const result = BondCalculator.simulateEarlyRedemption(otsBond, 1000, 1);

                // At month 1, OTS hasn't capitalized interest yet, so value = 1000
                expect(result.valueAtRedemption).toBe(1000);
                expect(result.grossProfit).toBe(0);
                expect(result.earlyRedemptionFee).toBe(0);
                expect(result.tax).toBe(0);
                expect(result.netProceeds).toBe(1000);
                expect(result.netProfit).toBe(0);
            });

            it('should calculate early redemption at month 2 for OTS', () => {
                const result = BondCalculator.simulateEarlyRedemption(otsBond, 1000, 2);

                // Still no interest at month 2 for OTS
                expect(result.valueAtRedemption).toBe(1000);
                expect(result.grossProfit).toBe(0);
                expect(result.earlyRedemptionFee).toBe(0);
                expect(result.netProceeds).toBe(1000);
            });
        });

        describe('ROR - Early redemption with fee', () => {
            const rorBond: Bond = {
                type: BondType.ROR,
                name: 'ROR Test',
                description: 'Test',
                interestRate: 6.0,
                durationMonths: 12,
                isIndexedToInflation: false,
                capitalizationFreqMonths: 1,
                earlyRedemptionFee: 0.5, // 0.5 PLN per 100 PLN
            };

            it('should apply early redemption fee correctly', () => {
                const result = BondCalculator.simulateEarlyRedemption(rorBond, 1000, 6);

                // After 6 months: 1000 + (1000 * 0.06/12 * 6) = 1000 + 30 = 1030
                expect(result.valueAtRedemption).toBeCloseTo(1030, 2);
                expect(result.grossProfit).toBeCloseTo(30, 2);

                // Fee = 0.5 PLN per 100 PLN = (0.5 * 1000) / 100 = 5 PLN
                expect(result.earlyRedemptionFee).toBeCloseTo(5, 2);

                // Tax = 30 * 0.19 = 5.70 PLN
                expect(result.tax).toBeCloseTo(5.70, 2);

                // Net proceeds = 1030 - 5 - 5.70 = 1019.30 PLN
                expect(result.netProceeds).toBeCloseTo(1019.30, 2);

                // Net profit = 1019.30 - 1000 = 19.30 PLN
                expect(result.netProfit).toBeCloseTo(19.30, 2);
            });

            it('should handle different investment amounts', () => {
                const result = BondCalculator.simulateEarlyRedemption(rorBond, 10000, 6);

                // Value: 10000 + (10000 * 0.06/12 * 6) = 10300
                expect(result.valueAtRedemption).toBeCloseTo(10300, 2);

                // Fee = 0.5 * 10000 / 100 = 50 PLN
                expect(result.earlyRedemptionFee).toBeCloseTo(50, 2);

                // Gross profit = 300
                // Tax = 300 * 0.19 = 57 PLN
                expect(result.tax).toBeCloseTo(57, 2);

                // Net proceeds = 10300 - 50 - 57 = 10193
                expect(result.netProceeds).toBeCloseTo(10193, 2);
            });

            it('should handle redemption at different months', () => {
                const result3 = BondCalculator.simulateEarlyRedemption(rorBond, 1000, 3);
                const result9 = BondCalculator.simulateEarlyRedemption(rorBond, 1000, 9);

                // Month 3: 1000 + 15 = 1015
                expect(result3.valueAtRedemption).toBeCloseTo(1015, 2);

                // Month 9: 1000 + 45 = 1045
                expect(result9.valueAtRedemption).toBeCloseTo(1045, 2);

                // Later redemption should yield higher net profit
                expect(result9.netProfit).toBeGreaterThan(result3.netProfit);
            });
        });

        describe('TOS - Early redemption with capitalization', () => {
            const tosBond: Bond = {
                type: BondType.TOS,
                name: 'TOS Test',
                description: 'Test',
                interestRate: 5.0,
                durationMonths: 36,
                isIndexedToInflation: false,
                capitalizationFreqMonths: 12,
                earlyRedemptionFee: 0.7,
            };

            it('should calculate early redemption before first capitalization', () => {
                const result = BondCalculator.simulateEarlyRedemption(tosBond, 1000, 6);

                // Before year 1, no capitalization yet
                expect(result.valueAtRedemption).toBe(1000);
                expect(result.grossProfit).toBe(0);

                // Fee = 0.7 * 1000 / 100 = 7 PLN
                expect(result.earlyRedemptionFee).toBeCloseTo(7, 2);

                // No tax since no profit
                expect(result.tax).toBe(0);

                // Net proceeds = 1000 - 7 = 993 PLN (loss due to fee)
                expect(result.netProceeds).toBeCloseTo(993, 2);
                expect(result.netProfit).toBeCloseTo(-7, 2);
            });

            it('should calculate early redemption after first capitalization', () => {
                const result = BondCalculator.simulateEarlyRedemption(tosBond, 1000, 18);

                // After 1 year: 1050, then flat until month 24
                expect(result.valueAtRedemption).toBeCloseTo(1050, 2);
                expect(result.grossProfit).toBeCloseTo(50, 2);

                // Fee = 7 PLN
                expect(result.earlyRedemptionFee).toBeCloseTo(7, 2);

                // Tax = 50 * 0.19 = 9.50 PLN
                expect(result.tax).toBeCloseTo(9.50, 2);

                // Net proceeds = 1050 - 7 - 9.50 = 1033.50 PLN
                expect(result.netProceeds).toBeCloseTo(1033.50, 2);
            });

            it('should calculate early redemption after two years', () => {
                const result = BondCalculator.simulateEarlyRedemption(tosBond, 1000, 30);

                // After 2 years: 1050 * 1.05 = 1102.5
                expect(result.valueAtRedemption).toBeCloseTo(1102.5, 2);

                const expectedFee = 7;
                const expectedTax = 102.5 * 0.19;
                const expectedNetProceeds = 1102.5 - expectedFee - expectedTax;

                expect(result.netProceeds).toBeCloseTo(expectedNetProceeds, 2);
            });
        });

        describe('COI - Inflation-indexed early redemption', () => {
            const coiBond: Bond = {
                type: BondType.COI,
                name: 'COI Test',
                description: 'Test',
                interestRate: 5.0,
                durationMonths: 48,
                isIndexedToInflation: true,
                capitalizationFreqMonths: 12,
                earlyRedemptionFee: 0.7,
            };

            it('should handle early redemption during first year', () => {
                const inflation = 3.0;
                const result = BondCalculator.simulateEarlyRedemption(coiBond, 1000, 6, inflation);

                // No interest paid yet at month 6
                expect(result.valueAtRedemption).toBe(1000);

                // Fee = 7 PLN
                expect(result.earlyRedemptionFee).toBeCloseTo(7, 2);

                // Net proceeds = 1000 - 7 = 993 PLN
                expect(result.netProceeds).toBeCloseTo(993, 2);
            });

            it('should handle early redemption after year 1 with inflation adjustment', () => {
                const inflation = 4.0;
                const result = BondCalculator.simulateEarlyRedemption(coiBond, 1000, 18, inflation);

                // Year 1: 1000 + 50 (5% interest) = 1050
                // COI pays interest, doesn't capitalize
                expect(result.valueAtRedemption).toBeCloseTo(1050, 2);

                const expectedFee = 7;
                const expectedTax = 50 * 0.19;
                const expectedNetProceeds = 1050 - expectedFee - expectedTax;

                expect(result.netProceeds).toBeCloseTo(expectedNetProceeds, 2);
            });

            it('should handle early redemption in year 3 with inflation', () => {
                const inflation = 5.0;
                const result = BondCalculator.simulateEarlyRedemption(coiBond, 1000, 30, inflation);

                // Year 1: 1050 (5%)
                // Year 2: 1050 + 65 (5% + 1.5% = 6.5%) = 1115
                // At month 30 (2.5 years)
                expect(result.valueAtRedemption).toBeCloseTo(1115, 2);
            });
        });

        describe('EDO - Long-term early redemption', () => {
            const edoBond: Bond = {
                type: BondType.EDO,
                name: 'EDO Test',
                description: 'Test',
                interestRate: 6.0,
                durationMonths: 120,
                isIndexedToInflation: true,
                capitalizationFreqMonths: 12,
                earlyRedemptionFee: 2.0, // Higher fee for EDO
            };

            it('should apply higher fee for EDO bonds', () => {
                const inflation = 3.0;
                const result = BondCalculator.simulateEarlyRedemption(edoBond, 1000, 6, inflation);

                // Fee = 2.0 * 1000 / 100 = 20 PLN
                expect(result.earlyRedemptionFee).toBeCloseTo(20, 2);

                // At month 6, no capitalization yet
                expect(result.valueAtRedemption).toBe(1000);
                expect(result.netProceeds).toBeCloseTo(980, 2); // 1000 - 20
                expect(result.netProfit).toBeCloseTo(-20, 2); // Loss
            });

            it('should calculate early redemption after several years', () => {
                const inflation = 4.0;
                const result = BondCalculator.simulateEarlyRedemption(edoBond, 10000, 60, inflation);

                // After 5 years with compounding
                // Year 1: 10600 (6%)
                // Year 2-5: 6% rate (4% inflation + 2% margin)
                // This should be substantial growth

                expect(result.valueAtRedemption).toBeGreaterThan(10000);
                expect(result.grossProfit).toBeGreaterThan(0);

                // Fee = 2.0 * 10000 / 100 = 200 PLN
                expect(result.earlyRedemptionFee).toBeCloseTo(200, 2);

                // Should still have net profit despite fee
                expect(result.netProfit).toBeGreaterThan(0);
            });
        });

        describe('Validation and edge cases', () => {
            const testBond: Bond = {
                type: BondType.ROR,
                name: 'Test',
                description: 'Test',
                interestRate: 5.0,
                durationMonths: 12,
                isIndexedToInflation: false,
                capitalizationFreqMonths: 1,
                earlyRedemptionFee: 0.5,
            };

            it('should throw error for redemption at month 0', () => {
                expect(() => {
                    BondCalculator.simulateEarlyRedemption(testBond, 1000, 0);
                }).toThrow();
            });

            it('should throw error for redemption at or after maturity', () => {
                expect(() => {
                    BondCalculator.simulateEarlyRedemption(testBond, 1000, 12);
                }).toThrow();

                expect(() => {
                    BondCalculator.simulateEarlyRedemption(testBond, 1000, 13);
                }).toThrow();
            });

            it('should throw error for negative redemption month', () => {
                expect(() => {
                    BondCalculator.simulateEarlyRedemption(testBond, 1000, -1);
                }).toThrow();
            });

            it('should handle zero investment amount', () => {
                const result = BondCalculator.simulateEarlyRedemption(testBond, 0, 6);

                expect(result.valueAtRedemption).toBe(0);
                expect(result.earlyRedemptionFee).toBe(0);
                expect(result.netProceeds).toBe(0);
            });

            it('should handle very small investment amounts', () => {
                const result = BondCalculator.simulateEarlyRedemption(testBond, 1, 6);

                expect(result.valueAtRedemption).toBeGreaterThanOrEqual(1);
                expect(result.earlyRedemptionFee).toBeCloseTo(0.005, 3); // 0.5 * 1 / 100
            });

            it('should always have netProceeds = valueAtRedemption - fee - tax', () => {
                const result = BondCalculator.simulateEarlyRedemption(testBond, 5000, 8);

                const calculatedNetProceeds =
                    result.valueAtRedemption - result.earlyRedemptionFee - result.tax;
                expect(result.netProceeds).toBeCloseTo(calculatedNetProceeds, 2);
            });

            it('should always have netProfit = netProceeds - initialAmount', () => {
                const initialAmount = 5000;
                const result = BondCalculator.simulateEarlyRedemption(testBond, initialAmount, 8);

                const calculatedNetProfit = result.netProceeds - initialAmount;
                expect(result.netProfit).toBeCloseTo(calculatedNetProfit, 2);
            });
        });

        describe('Fee impact comparison', () => {
            it('should show loss when fee exceeds profit', () => {
                const highFeeBond: Bond = {
                    type: BondType.OTS,
                    name: 'High Fee Bond',
                    description: 'Test',
                    interestRate: 2.0, // Low interest
                    durationMonths: 12,
                    isIndexedToInflation: false,
                    capitalizationFreqMonths: 0,
                    earlyRedemptionFee: 5.0, // High fee: 5 PLN per 100 PLN
                };

                const result = BondCalculator.simulateEarlyRedemption(highFeeBond, 1000, 6);

                // No interest at month 6 for OTS
                // Fee = 5 * 1000 / 100 = 50 PLN
                expect(result.earlyRedemptionFee).toBeCloseTo(50, 2);
                expect(result.netProfit).toBeCloseTo(-50, 2); // Loss
                expect(result.netProceeds).toBeCloseTo(950, 2);
            });

            it('should compare bonds with different fees', () => {
                const lowFeeBond: Bond = Constants.BONDS.find((b) => b.type === BondType.ROR)!;
                const highFeeBond: Bond = Constants.BONDS.find((b) => b.type === BondType.EDO)!;

                const lowFeeResult = BondCalculator.simulateEarlyRedemption(lowFeeBond, 10000, 6);
                const highFeeResult = BondCalculator.simulateEarlyRedemption(highFeeBond, 10000, 6);

                // EDO should have higher fee
                expect(highFeeResult.earlyRedemptionFee).toBeGreaterThan(lowFeeResult.earlyRedemptionFee);
            });
        });

        describe('Real bond configurations from Constants', () => {
            it('should handle early redemption for all bonds in Constants.BONDS', () => {
                Constants.BONDS.forEach((bond) => {
                    if (bond.durationMonths > 1) {
                        const midMonth = Math.floor(bond.durationMonths / 2);
                        const result = BondCalculator.simulateEarlyRedemption(bond, 1000, midMonth, 5.0);

                        expect(result.redemptionMonth).toBe(midMonth);
                        expect(result.valueAtRedemption).toBeGreaterThanOrEqual(1000);
                        expect(result.earlyRedemptionFee).toBeGreaterThanOrEqual(0);
                        expect(result.tax).toBeGreaterThanOrEqual(0);
                        expect(result.netProceeds).toBeGreaterThan(0);
                    }
                });
            });
        });
    });

    describe('Advanced Scenarios', () => {
        describe('Inflation Edge Cases', () => {
            it('should handle negative inflation (deflation)', () => {
                const edoBond = Constants.BONDS.find(b => b.type === BondType.EDO)!;
                // EDO margin is 2%, so -1% inflation + 2% margin = 1% interest
                const deflationRate = -1.0;
                const result = BondCalculator.simulate(edoBond, 1000, deflationRate);

                // Year 1 is fixed 5.6% regardless of inflation
                expect(result.values[12]).toBeCloseTo(1056, 2);

                // Year 2: 1056 * (1.01) = 1066.56
                expect(result.values[24]).toBeCloseTo(1066.56, 2);
            });

            it('should handle high inflation', () => {
                const coiBond = Constants.BONDS.find(b => b.type === BondType.COI)!;
                const hyperInflation = 20.0;
                const result = BondCalculator.simulate(coiBond, 1000, hyperInflation);

                // Year 2 rate = 20% + 1.5% = 21.5%
                // Interest = 1000 * 0.215 = 215
                // Year 2 Total = 1000 + 50 (Y1) + 215 = 1265
                expect(result.values[24]).toBeCloseTo(1265, 2);
            });
        });

        describe('Complex Early Redemption', () => {
            const edoBond = Constants.BONDS.find(b => b.type === BondType.EDO)!;

            it('should handle redemption at capitalization boundary (Month 12)', () => {
                // Redemption exactly at month 12
                // Should include first year capitalization?
                // Usually logic is: Capitalize first, then redeem? Or redeem before?
                // Our logic: simulate() calculates month 12 value WITH capitalization.
                // simulateEarlyRedemption uses simulate().values[12].
                // So it assumes you redeem AFTER capitalization.

                const result = BondCalculator.simulateEarlyRedemption(edoBond, 1000, 12);

                // Value should be 1056 (capitalized)
                expect(result.valueAtRedemption).toBeCloseTo(1056, 2);

                // Fee applies.
                expect(result.earlyRedemptionFee).toBeGreaterThan(0);
            });

            it('should handle redemption one month before capitalization (Month 11)', () => {
                const result = BondCalculator.simulateEarlyRedemption(edoBond, 1000, 11);

                // Month 11 value is still 1000 (no cap yet).
                expect(result.valueAtRedemption).toBe(1000);
            });
        });
    });
});

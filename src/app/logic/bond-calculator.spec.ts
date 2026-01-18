import { TestBed } from '@angular/core/testing';
import { BondCalculatorService, BondCalculatorService as BondCalculator } from './bond-calculator';
import { Bond, BondType, Constants } from './constants';

describe('BondCalculatorService', () => {
    let service: BondCalculatorService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [BondCalculatorService]
        });
        service = TestBed.inject(BondCalculatorService);
    });

    describe('simulate', () => {
        describe('OTS - 3-month bond with capitalization at maturity', () => {
            const otsBond: Bond = {
                type: BondType.OTS,
                name: 'OTS - 3-miesięczne',
                description: 'Test OTS',
                interestRate: 4.0,
                durationMonths: 3,
                isIndexedToInflation: false,
                capitalizationFreqMonths: 0,
                earlyRedemptionFee: 0,
            };

            it('should calculate correct value for 1000 PLN investment', () => {
                const result = service.simulate(otsBond, 1000);

                expect(result.months[0]).toBe(0);
                expect(result.values[0]).toBe(1000);
                expect(result.values[1]).toBe(1000);
                expect(result.values[2]).toBe(1000);

                const expectedFinalValue = 1000 + 10;
                expect(result.values[3]).toBe(expectedFinalValue);

                expect(result.totalProfit).toBe(10);

                const tax = 10 * Constants.TAX_RATE;
                expect(result.netProfit).toBeCloseTo(10 - tax, 2);
            });

            it('should calculate correct value for 5000 PLN investment', () => {
                const result = service.simulate(otsBond, 5000);

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
                interestRate: 6.0,
                durationMonths: 12,
                isIndexedToInflation: false,
                capitalizationFreqMonths: 1,
                earlyRedemptionFee: 0.5,
            };

            it('should accumulate monthly interest payments correctly', () => {
                const result = service.simulate(rorBond, 1000);

                expect(result.values[0]).toBe(1000);

                const monthlyRate = 0.06 / 12;

                expect(result.values[1]).toBeCloseTo(1000 + 1000 * monthlyRate, 2);
                expect(result.values[2]).toBeCloseTo(1000 + 1000 * monthlyRate * 2, 2);
                expect(result.values[12]).toBeCloseTo(1060, 2);
                expect(result.totalProfit).toBeCloseTo(60, 2);

                const tax = 60 * Constants.TAX_RATE;
                expect(result.netProfit).toBeCloseTo(60 - tax, 2);
            });

            it('should handle different investment amounts', () => {
                const result = service.simulate(rorBond, 10000);

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
                interestRate: 5.0,
                durationMonths: 36,
                isIndexedToInflation: false,
                capitalizationFreqMonths: 12,
                earlyRedemptionFee: 0.7,
            };

            it('should calculate compound interest with annual capitalization', () => {
                const result = service.simulate(tosBond, 1000);

                expect(result.values[0]).toBe(1000);

                for (let i = 1; i < 12; i++) {
                    expect(result.values[i]).toBe(1000);
                }

                expect(result.values[12]).toBeCloseTo(1050, 2);
                expect(result.values[24]).toBeCloseTo(1102.5, 2);
                expect(result.values[36]).toBeCloseTo(1157.625, 2);

                const expectedProfit = 1157.625 - 1000;
                expect(result.totalProfit).toBeCloseTo(expectedProfit, 2);

                const tax = expectedProfit * Constants.TAX_RATE;
                expect(result.netProfit).toBeCloseTo(expectedProfit - tax, 2);
            });
        });

        describe('COI - 4-year inflation-indexed bond with annual payments', () => {
            const coiBond: Bond = {
                type: BondType.COI,
                name: 'COI - 4-letnie',
                description: 'Test COI',
                interestRate: 5.0,
                durationMonths: 48,
                isIndexedToInflation: true,
                capitalizationFreqMonths: 12,
                earlyRedemptionFee: 0.7,
            };

            it('should use fixed rate for year 1, then inflation + margin', () => {
                const inflation = 3.0;
                const result = service.simulate(coiBond, 1000, inflation);

                expect(result.values[0]).toBe(1000);
                expect(result.values[12]).toBeCloseTo(1050, 2);
                expect(result.values[24]).toBeCloseTo(1095, 2);
                expect(result.values[36]).toBeCloseTo(1140, 2);
                expect(result.values[48]).toBeCloseTo(1185, 2);
                expect(result.totalProfit).toBeCloseTo(185, 2);
            });

            it('should adapt to different inflation rates', () => {
                const highInflation = 8.0;
                const result = service.simulate(coiBond, 1000, highInflation);

                expect(result.totalProfit).toBeCloseTo(335, 2);
            });
        });

        describe('EDO - 10-year inflation-indexed bond with annual capitalization', () => {
            const edoBond: Bond = {
                type: BondType.EDO,
                name: 'EDO - 10-letnie',
                description: 'Test EDO',
                interestRate: 6.0,
                durationMonths: 120,
                isIndexedToInflation: true,
                capitalizationFreqMonths: 12,
                earlyRedemptionFee: 2.0,
            };

            it('should capitalize interest annually with inflation indexing', () => {
                const inflation = 4.0;
                const result = service.simulate(edoBond, 1000, inflation);

                expect(result.values[0]).toBe(1000);
                expect(result.values[12]).toBeCloseTo(1060, 2);
                expect(result.values[24]).toBeCloseTo(1123.6, 2);
                expect(result.values[36]).toBeCloseTo(1191.016, 2);
                expect(result.totalProfit).toBeGreaterThan(0);
                expect(result.netProfit).toBeGreaterThan(0);
                expect(result.netProfit).toBeLessThan(result.totalProfit);
            });

            it('should handle the full 10-year duration', () => {
                const inflation = 3.0;
                const result = service.simulate(edoBond, 10000, inflation);

                expect(result.months.length).toBe(121);
                expect(result.values.length).toBe(121);
                expect(result.values[120]).toBeGreaterThan(10000);
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

                const result = service.simulate(bond, 1000);

                expect(result.totalProfit).toBeCloseTo(100, 2);

                const expectedTax = 100 * Constants.TAX_RATE;

                expect(expectedTax).toBeCloseTo(19, 2);
                expect(result.netProfit).toBeCloseTo(81, 2);
            });

            it('should not apply negative tax for losses', () => {
                const bond: Bond = {
                    type: BondType.OTS,
                    name: 'Test',
                    description: 'Test',
                    interestRate: 0.0,
                    durationMonths: 12,
                    isIndexedToInflation: false,
                    capitalizationFreqMonths: 0,
                    earlyRedemptionFee: 0,
                };

                const result = service.simulate(bond, 1000);

                expect(result.totalProfit).toBe(0);
                expect(result.netProfit).toBe(0);
            });
        });

        describe('Edge cases', () => {
            it('should handle zero investment amount', () => {
                const bond: Bond = Constants.BONDS[0];
                const result = service.simulate(bond, 0);

                expect(result.values[0]).toBe(0);
                expect(result.totalProfit).toBe(0);
                expect(result.netProfit).toBe(0);
            });

            it('should handle very small investment amounts', () => {
                const bond: Bond = Constants.BONDS[0];
                const result = service.simulate(bond, 1);

                expect(result.values[0]).toBe(1);
                expect(result.totalProfit).toBeGreaterThanOrEqual(0);
            });

            it('should handle very large investment amounts', () => {
                const bond: Bond = Constants.BONDS[0];
                const result = service.simulate(bond, 1000000);

                expect(result.values[0]).toBe(1000000);
                expect(result.values[result.values.length - 1]).toBeGreaterThan(1000000);
            });
        });

        describe('Array consistency', () => {
            it('should have matching lengths for months and values arrays', () => {
                const bond: Bond = Constants.BONDS[0];
                const result = service.simulate(bond, 1000);

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

                const result = service.simulate(bond, 1000);

                expect(result.months.length).toBe(13);
                expect(result.months[0]).toBe(0);
                expect(result.months[12]).toBe(12);
            });

            it('should have monotonically increasing or equal values', () => {
                const bond: Bond = Constants.BONDS[0];
                const result = service.simulate(bond, 1000);

                for (let i = 1; i < result.values.length; i++) {
                    expect(result.values[i]).toBeGreaterThanOrEqual(result.values[i - 1]);
                }
            });
        });

        describe('Real bond configurations from Constants', () => {
            it('should calculate correctly for all bonds in Constants.BONDS', () => {
                Constants.BONDS.forEach((bond) => {
                    const result = service.simulate(bond, 1000, 5.0);

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
                earlyRedemptionFee: 0,
            };

            it('should calculate early redemption correctly for bond with no fee', () => {
                const result = service.simulateEarlyRedemption(otsBond, 1000, 1);

                expect(result.valueAtRedemption).toBe(1000);
                expect(result.grossProfit).toBe(0);
                expect(result.earlyRedemptionFee).toBe(0);
                expect(result.tax).toBe(0);
                expect(result.netProceeds).toBe(1000);
                expect(result.netProfit).toBe(0);
            });

            it('should calculate early redemption at month 2 for OTS', () => {
                const result = service.simulateEarlyRedemption(otsBond, 1000, 2);

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
                earlyRedemptionFee: 0.5,
            };

            it('should apply early redemption fee correctly', () => {
                const result = service.simulateEarlyRedemption(rorBond, 1000, 6);

                expect(result.valueAtRedemption).toBeCloseTo(1030, 2);
                expect(result.grossProfit).toBeCloseTo(30, 2);
                expect(result.earlyRedemptionFee).toBeCloseTo(5, 2);
                expect(result.tax).toBeCloseTo(5.70, 2);
                expect(result.netProceeds).toBeCloseTo(1019.30, 2);
                expect(result.netProfit).toBeCloseTo(19.30, 2);
            });

            it('should handle different investment amounts', () => {
                const result = service.simulateEarlyRedemption(rorBond, 10000, 6);

                expect(result.valueAtRedemption).toBeCloseTo(10300, 2);
                expect(result.earlyRedemptionFee).toBeCloseTo(50, 2);
                expect(result.tax).toBeCloseTo(57, 2);
                expect(result.netProceeds).toBeCloseTo(10193, 2);
            });

            it('should handle redemption at different months', () => {
                const result3 = service.simulateEarlyRedemption(rorBond, 1000, 3);
                const result9 = service.simulateEarlyRedemption(rorBond, 1000, 9);

                expect(result3.valueAtRedemption).toBeCloseTo(1015, 2);
                expect(result9.valueAtRedemption).toBeCloseTo(1045, 2);
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
                const result = service.simulateEarlyRedemption(tosBond, 1000, 6);

                expect(result.valueAtRedemption).toBe(1000);
                expect(result.grossProfit).toBe(0);
                expect(result.earlyRedemptionFee).toBeCloseTo(7, 2);
                expect(result.tax).toBe(0);
                expect(result.netProceeds).toBeCloseTo(993, 2);
                expect(result.netProfit).toBeCloseTo(-7, 2);
            });

            it('should calculate early redemption after first capitalization', () => {
                const result = service.simulateEarlyRedemption(tosBond, 1000, 18);

                expect(result.valueAtRedemption).toBeCloseTo(1050, 2);
                expect(result.grossProfit).toBeCloseTo(50, 2);
                expect(result.earlyRedemptionFee).toBeCloseTo(7, 2);
                expect(result.tax).toBeCloseTo(9.50, 2);
                expect(result.netProceeds).toBeCloseTo(1033.50, 2);
            });

            it('should calculate early redemption after two years', () => {
                const result = service.simulateEarlyRedemption(tosBond, 1000, 30);

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
                const result = service.simulateEarlyRedemption(coiBond, 1000, 6, inflation);

                expect(result.valueAtRedemption).toBe(1000);
                expect(result.earlyRedemptionFee).toBeCloseTo(7, 2);
                expect(result.netProceeds).toBeCloseTo(993, 2);
            });

            it('should handle early redemption after year 1 with inflation adjustment', () => {
                const inflation = 4.0;
                const result = service.simulateEarlyRedemption(coiBond, 1000, 18, inflation);

                expect(result.valueAtRedemption).toBeCloseTo(1050, 2);

                const expectedFee = 7;
                const expectedTax = 50 * 0.19;
                const expectedNetProceeds = 1050 - expectedFee - expectedTax;

                expect(result.netProceeds).toBeCloseTo(expectedNetProceeds, 2);
            });

            it('should handle early redemption in year 3 with inflation', () => {
                const inflation = 5.0;
                const result = service.simulateEarlyRedemption(coiBond, 1000, 30, inflation);

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
                earlyRedemptionFee: 2.0,
            };

            it('should apply higher fee for EDO bonds', () => {
                const inflation = 3.0;
                const result = service.simulateEarlyRedemption(edoBond, 1000, 6, inflation);

                expect(result.earlyRedemptionFee).toBeCloseTo(20, 2);
                expect(result.valueAtRedemption).toBe(1000);
                expect(result.netProceeds).toBeCloseTo(980, 2);
                expect(result.netProfit).toBeCloseTo(-20, 2);
            });

            it('should calculate early redemption after several years', () => {
                const inflation = 4.0;
                const result = service.simulateEarlyRedemption(edoBond, 10000, 60, inflation);

                expect(result.valueAtRedemption).toBeGreaterThan(10000);
                expect(result.grossProfit).toBeGreaterThan(0);
                expect(result.earlyRedemptionFee).toBeCloseTo(200, 2);
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
                    service.simulateEarlyRedemption(testBond, 1000, 0);
                }).toThrow();
            });

            it('should throw error for redemption at or after maturity', () => {
                expect(() => {
                    service.simulateEarlyRedemption(testBond, 1000, 12);
                }).toThrow();

                expect(() => {
                    service.simulateEarlyRedemption(testBond, 1000, 13);
                }).toThrow();
            });

            it('should throw error for negative redemption month', () => {
                expect(() => {
                    service.simulateEarlyRedemption(testBond, 1000, -1);
                }).toThrow();
            });

            it('should handle zero investment amount', () => {
                const result = service.simulateEarlyRedemption(testBond, 0, 6);

                expect(result.valueAtRedemption).toBe(0);
                expect(result.earlyRedemptionFee).toBe(0);
                expect(result.netProceeds).toBe(0);
            });

            it('should handle very small investment amounts', () => {
                const result = service.simulateEarlyRedemption(testBond, 1, 6);

                expect(result.valueAtRedemption).toBeGreaterThanOrEqual(1);
                expect(result.earlyRedemptionFee).toBeCloseTo(0.005, 3); // 0.5 * 1 / 100
            });

            it('should always have netProceeds = valueAtRedemption - fee - tax', () => {
                const result = service.simulateEarlyRedemption(testBond, 5000, 8);

                const calculatedNetProceeds =
                    result.valueAtRedemption - result.earlyRedemptionFee - result.tax;
                expect(result.netProceeds).toBeCloseTo(calculatedNetProceeds, 2);
            });

            it('should always have netProfit = netProceeds - initialAmount', () => {
                const initialAmount = 5000;
                const result = service.simulateEarlyRedemption(testBond, initialAmount, 8);

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
                    interestRate: 2.0,
                    durationMonths: 12,
                    isIndexedToInflation: false,
                    capitalizationFreqMonths: 0,
                    earlyRedemptionFee: 5.0,
                };

                const result = service.simulateEarlyRedemption(highFeeBond, 1000, 6);

                expect(result.earlyRedemptionFee).toBeCloseTo(50, 2);
                expect(result.netProfit).toBeCloseTo(-50, 2);
                expect(result.netProceeds).toBeCloseTo(950, 2);
            });

            it('should compare bonds with different fees', () => {
                const lowFeeBond: Bond = Constants.BONDS.find((b) => b.type === BondType.ROR)!;
                const highFeeBond: Bond = Constants.BONDS.find((b) => b.type === BondType.EDO)!;

                const lowFeeResult = service.simulateEarlyRedemption(lowFeeBond, 10000, 6);
                const highFeeResult = service.simulateEarlyRedemption(highFeeBond, 10000, 6);

                expect(highFeeResult.earlyRedemptionFee).toBeGreaterThan(lowFeeResult.earlyRedemptionFee);
            });
        });

        describe('Real bond configurations from Constants', () => {
            it('should handle early redemption for all bonds in Constants.BONDS', () => {
                Constants.BONDS.forEach((bond) => {
                    if (bond.durationMonths > 1) {
                        const midMonth = Math.floor(bond.durationMonths / 2);
                        const result = service.simulateEarlyRedemption(bond, 1000, midMonth, 5.0);

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
                const deflationRate = -1.0;
                const result = service.simulate(edoBond, 1000, deflationRate);

                expect(result.values[12]).toBeCloseTo(1056, 2);
                expect(result.values[24]).toBeCloseTo(1066.56, 2);
            });

            it('should handle high inflation', () => {
                const coiBond = Constants.BONDS.find(b => b.type === BondType.COI)!;
                const hyperInflation = 20.0;
                const result = service.simulate(coiBond, 1000, hyperInflation);

                expect(result.values[24]).toBeCloseTo(1265, 2);
            });
        });

        describe('Complex Early Redemption', () => {
            const edoBond = Constants.BONDS.find(b => b.type === BondType.EDO)!;

            it('should handle redemption at capitalization boundary (Month 12)', () => {
                const result = service.simulateEarlyRedemption(edoBond, 1000, 12);

                expect(result.valueAtRedemption).toBeCloseTo(1056, 2);
                expect(result.earlyRedemptionFee).toBeGreaterThan(0);
            });

            it('should handle redemption one month before capitalization (Month 11)', () => {
                const result = service.simulateEarlyRedemption(edoBond, 1000, 11);

                expect(result.valueAtRedemption).toBe(1000);
            });
        });
    });

    describe('Default Inflation Rate', () => {
        const coiBond = Constants.BONDS.find(b => b.type === BondType.COI)!;

        it('should use Constants.INFLATION_RATE when no inflation argument is provided', () => {

            const result = service.simulate(coiBond, 1000);

            expect(result.values[12]).toBeCloseTo(1050, 2);

            const expectedInterestY2 = 1000 * ((Constants.INFLATION_RATE + 1.5) / 100);
            const expectedValueY2 = 1050 + expectedInterestY2;

            expect(result.values[24]).toBeCloseTo(expectedValueY2, 2);
        });
    });
});

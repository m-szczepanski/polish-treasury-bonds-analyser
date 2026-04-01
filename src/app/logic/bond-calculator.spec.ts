import { TestBed } from '@angular/core/testing';
import { BondCalculatorService } from './bond-calculator';
import { Bond, BondType, Constants } from './constants';

describe('BondCalculatorService', () => {
  let service: BondCalculatorService;

  const createBond = (overrides: Partial<Bond>): Bond => ({
    type: BondType.OTS,
    name: 'Test Bond',
    description: 'Synthetic bond fixture for deterministic tests',
    interestRate: 5,
    durationMonths: 12,
    isIndexedToInflation: false,
    capitalizationFreqMonths: 12,
    earlyRedemptionFee: 0,
    ...overrides,
  });

  const syntheticBonds = {
    ots: createBond({
      type: BondType.OTS,
      name: 'OTS Synthetic',
      durationMonths: 3,
      interestRate: 2,
      capitalizationFreqMonths: 0,
      earlyRedemptionFee: 0,
    }),
    ror: createBond({
      type: BondType.ROR,
      name: 'ROR Synthetic',
      durationMonths: 12,
      interestRate: 4,
      capitalizationFreqMonths: 1,
      earlyRedemptionFee: 0.5,
    }),
    dor: createBond({
      type: BondType.DOR,
      name: 'DOR Synthetic',
      durationMonths: 24,
      interestRate: 4.15,
      capitalizationFreqMonths: 1,
      earlyRedemptionFee: 0.7,
    }),
    tos: createBond({
      type: BondType.TOS,
      name: 'TOS Synthetic',
      durationMonths: 36,
      interestRate: 4.4,
      capitalizationFreqMonths: 12,
      earlyRedemptionFee: 0.7,
    }),
    coi: createBond({
      type: BondType.COI,
      name: 'COI Synthetic',
      durationMonths: 48,
      interestRate: 4.75,
      isIndexedToInflation: true,
      capitalizationFreqMonths: 12,
      earlyRedemptionFee: 0.7,
    }),
    edo: createBond({
      type: BondType.EDO,
      name: 'EDO Synthetic',
      durationMonths: 120,
      interestRate: 5.35,
      isIndexedToInflation: true,
      capitalizationFreqMonths: 12,
      earlyRedemptionFee: 2,
    }),
  };

  const expectArrayShape = (
    result: { months: number[]; values: number[] },
    durationMonths: number,
    initialAmount: number
  ) => {
    expect(result.months.length).toBe(durationMonths + 1);
    expect(result.values.length).toBe(durationMonths + 1);
    expect(result.months[0]).toBe(0);
    expect(result.months[durationMonths]).toBe(durationMonths);
    expect(result.values[0]).toBe(initialAmount);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BondCalculatorService],
    });
    service = TestBed.inject(BondCalculatorService);
  });

  describe('simulate - deterministic logic', () => {
    it('calculates OTS profit only at maturity', () => {
      const investment = 1000;
      const bond = syntheticBonds.ots;
      const result = service.simulate(bond, investment);

      const expectedProfit = (investment * bond.interestRate) / 100 / 12 * bond.durationMonths;
      const expectedTax = expectedProfit * Constants.TAX_RATE;

      expect(result.values[1]).toBe(investment);
      expect(result.values[2]).toBe(investment);
      expect(result.values[3]).toBe(investment + expectedProfit);
      expect(result.totalProfit).toBeCloseTo(expectedProfit, 6);
      expect(result.netProfit).toBeCloseTo(expectedProfit - expectedTax, 6);
      expectArrayShape(result, bond.durationMonths, investment);
    });

    it('calculates linear monthly accumulation for monthly-payment bonds', () => {
      const investment = 1000;
      const bond = syntheticBonds.ror;
      const result = service.simulate(bond, investment);

      const monthlyRate = bond.interestRate / 100 / 12;
      const expectedMonth6 = investment + investment * monthlyRate * 6;
      const expectedMonth12 = investment + investment * monthlyRate * 12;

      expect(result.values[6]).toBeCloseTo(expectedMonth6, 6);
      expect(result.values[12]).toBeCloseTo(expectedMonth12, 6);
      expectArrayShape(result, bond.durationMonths, investment);
    });

    it('calculates monthly accumulation consistently for DOR over 24 months', () => {
      const investment = 1000;
      const bond = syntheticBonds.dor;
      const result = service.simulate(bond, investment);

      const monthlyRate = bond.interestRate / 100 / 12;
      const expectedMonth12 = investment + investment * monthlyRate * 12;
      const expectedMonth24 = investment + investment * monthlyRate * 24;

      expect(result.values[12]).toBeCloseTo(expectedMonth12, 6);
      expect(result.values[24]).toBeCloseTo(expectedMonth24, 6);
      expectArrayShape(result, bond.durationMonths, investment);
    });

    it('calculates annual capitalization for fixed-rate annual bonds', () => {
      const investment = 1000;
      const bond = syntheticBonds.tos;
      const result = service.simulate(bond, investment);

      const yearlyRate = bond.interestRate / 100;
      const year1 = investment * (1 + yearlyRate);
      const year2 = year1 * (1 + yearlyRate);
      const year3 = year2 * (1 + yearlyRate);

      expect(result.values[12]).toBeCloseTo(year1, 6);
      expect(result.values[24]).toBeCloseTo(year2, 6);
      expect(result.values[36]).toBeCloseTo(year3, 6);
      expectArrayShape(result, bond.durationMonths, investment);
    });

    it('applies inflation + margin after first year for COI', () => {
      const bond = syntheticBonds.coi;
      const investment = 1000;
      const inflation = 3;
      const result = service.simulate(bond, investment, inflation);

      const year1Rate = bond.interestRate / 100;
      const year2Rate = (inflation + 1.5) / 100;
      const year1 = investment + investment * year1Rate;
      const year2 = year1 + investment * year2Rate;

      expect(result.values[12]).toBeCloseTo(year1, 6);
      expect(result.values[24]).toBeCloseTo(year2, 6);
      expect(result.values[24]).toBeGreaterThan(result.values[12]);
    });

    it('applies inflation + margin with capitalization for EDO', () => {
      const bond = syntheticBonds.edo;
      const investment = 1000;
      const inflation = 4;
      const result = service.simulate(bond, investment, inflation);

      const year1 = investment * (1 + bond.interestRate / 100);
      const year2 = year1 * (1 + (inflation + 2) / 100);

      expect(result.values[12]).toBeCloseTo(year1, 6);
      expect(result.values[24]).toBeCloseTo(year2, 6);
    });

    it('uses Constants.INFLATION_RATE when inflation argument is omitted', () => {
      const bond = syntheticBonds.coi;
      const investment = 1000;

      const withDefault = service.simulate(bond, investment);
      const explicitDefault = service.simulate(bond, investment, Constants.INFLATION_RATE);

      expect(withDefault.values).toEqual(explicitDefault.values);
      expect(withDefault.totalProfit).toBeCloseTo(explicitDefault.totalProfit, 8);
    });

    it('applies tax only to positive gross profit', () => {
      const zeroRateOts = createBond({
        type: BondType.OTS,
        durationMonths: 3,
        capitalizationFreqMonths: 0,
        interestRate: 0,
      });

      const result = service.simulate(zeroRateOts, 1000);
      expect(result.totalProfit).toBe(0);
      expect(result.netProfit).toBe(0);
    });

    it('keeps values monotonic non-decreasing for positive rates', () => {
      const result = service.simulate(syntheticBonds.edo, 1000, 5);

      for (let i = 1; i < result.values.length; i++) {
        expect(result.values[i]).toBeGreaterThanOrEqual(result.values[i - 1]);
      }
    });

    it('keeps capital unchanged for unsupported capitalization frequency', () => {
      const investment = 1000;
      const unknownCapitalizationBond = createBond({
        type: BondType.TOS,
        durationMonths: 6,
        interestRate: 15,
        capitalizationFreqMonths: 6,
      });

      const result = service.simulate(unknownCapitalizationBond, investment);

      expect(result.values).toEqual(Array(unknownCapitalizationBond.durationMonths + 1).fill(investment));
      expect(result.totalProfit).toBe(0);
      expect(result.netProfit).toBe(0);
    });
  });

  describe('simulateEarlyRedemption - deterministic logic', () => {
    it('throws for invalid redemption months', () => {
      const bond = syntheticBonds.ror;

      expect(() => service.simulateEarlyRedemption(bond, 1000, 0)).toThrow();
      expect(() => service.simulateEarlyRedemption(bond, 1000, -1)).toThrow();
      expect(() => service.simulateEarlyRedemption(bond, 1000, bond.durationMonths)).toThrow();
      expect(() => service.simulateEarlyRedemption(bond, 1000, bond.durationMonths + 1)).toThrow();
    });

    it('applies redemption fee and tax formula correctly', () => {
      const bond = syntheticBonds.ror;
      const investment = 1000;
      const redemptionMonth = 6;

      const result = service.simulateEarlyRedemption(bond, investment, redemptionMonth);
      const monthlyRate = bond.interestRate / 100 / 12;
      const expectedValueAtRedemption = investment + investment * monthlyRate * redemptionMonth;
      const expectedGrossProfit = expectedValueAtRedemption - investment;
      const expectedFee = (bond.earlyRedemptionFee * investment) / 100;
      const expectedTax = expectedGrossProfit * Constants.TAX_RATE;
      const expectedNetProceeds = expectedValueAtRedemption - expectedFee - expectedTax;

      expect(result.valueAtRedemption).toBeCloseTo(expectedValueAtRedemption, 6);
      expect(result.grossProfit).toBeCloseTo(expectedGrossProfit, 6);
      expect(result.earlyRedemptionFee).toBeCloseTo(expectedFee, 6);
      expect(result.tax).toBeCloseTo(expectedTax, 6);
      expect(result.netProceeds).toBeCloseTo(expectedNetProceeds, 6);
      expect(result.netProfit).toBeCloseTo(expectedNetProceeds - investment, 6);
    });

    it('handles early redemption for annual-capitalization bond before first year', () => {
      const bond = syntheticBonds.tos;
      const investment = 1000;

      const result = service.simulateEarlyRedemption(bond, investment, 6);
      const expectedFee = (bond.earlyRedemptionFee * investment) / 100;

      expect(result.valueAtRedemption).toBe(investment);
      expect(result.tax).toBe(0);
      expect(result.netProceeds).toBeCloseTo(investment - expectedFee, 6);
      expect(result.netProfit).toBeCloseTo(-expectedFee, 6);
    });

    it('handles early redemption for annual-capitalization bond after first year', () => {
      const bond = syntheticBonds.tos;
      const investment = 1000;

      const result = service.simulateEarlyRedemption(bond, investment, 18);
      const valueAfterYear1 = investment * (1 + bond.interestRate / 100);

      expect(result.valueAtRedemption).toBeCloseTo(valueAfterYear1, 6);
      expect(result.grossProfit).toBeCloseTo(valueAfterYear1 - investment, 6);
    });

    it('keeps accounting identity: netProceeds = value - fee - tax', () => {
      const result = service.simulateEarlyRedemption(syntheticBonds.edo, 5000, 60, 4);

      expect(result.netProceeds).toBeCloseTo(
        result.valueAtRedemption - result.earlyRedemptionFee - result.tax,
        8
      );
      expect(result.netProfit).toBeCloseTo(result.netProceeds - 5000, 8);
    });

    it('does not apply negative tax when gross profit is negative', () => {
      const negativeRateBond = createBond({
        type: BondType.ROR,
        durationMonths: 12,
        interestRate: -2,
        capitalizationFreqMonths: 1,
        earlyRedemptionFee: 0,
      });

      const result = service.simulateEarlyRedemption(negativeRateBond, 1000, 6);

      expect(result.grossProfit).toBeLessThan(0);
      expect(result.tax).toBe(0);
      expect(result.netProceeds).toBeCloseTo(result.valueAtRedemption, 8);
    });
  });

  describe('Constants.BONDS contract tests', () => {
    it('contains all supported bond types exactly once', () => {
      const bondTypes = Constants.BONDS.map((bond) => bond.type);
      expect(new Set(bondTypes).size).toBe(Object.values(BondType).length);
      Object.values(BondType).forEach((bondType) => {
        expect(bondTypes.filter((type) => type === bondType).length).toBe(1);
      });
    });

    it('has valid and safe configuration values', () => {
      Constants.BONDS.forEach((bond) => {
        expect(bond.name.trim().length).toBeGreaterThan(0);
        expect(bond.description.trim().length).toBeGreaterThan(0);
        expect(bond.durationMonths).toBeGreaterThan(0);
        expect(bond.interestRate).toBeGreaterThanOrEqual(0);
        expect(bond.earlyRedemptionFee).toBeGreaterThanOrEqual(0);
        expect([0, 1, 12]).toContain(bond.capitalizationFreqMonths);
      });
    });

    it('produces finite simulation outputs for all configured bonds', () => {
      Constants.BONDS.forEach((bond) => {
        const result = service.simulate(bond, 1000, 5);

        expectArrayShape(result, bond.durationMonths, 1000);
        result.values.forEach((value) => {
          expect(Number.isFinite(value)).toBe(true);
        });
        expect(Number.isFinite(result.totalProfit)).toBe(true);
        expect(Number.isFinite(result.netProfit)).toBe(true);
        expect(result.netProfit).toBeLessThanOrEqual(result.totalProfit);
      });
    });

    it('applies configured rates on the first interest event for each bond type', () => {
      const investment = 1000;

      Constants.BONDS.forEach((bond) => {
        const result = service.simulate(bond, investment, 5);

        if (bond.capitalizationFreqMonths === 0) {
          const expectedAtMaturity =
            investment + (investment * bond.interestRate) / 100 * (bond.durationMonths / 12);
          expect(result.values[bond.durationMonths]).toBeCloseTo(expectedAtMaturity, 6);
          return;
        }

        if (bond.capitalizationFreqMonths === 1) {
          const expectedMonth1 = investment + (investment * bond.interestRate) / 100 / 12;
          expect(result.values[1]).toBeCloseTo(expectedMonth1, 6);
          return;
        }

        if (bond.capitalizationFreqMonths === 12) {
          const expectedMonth12 = investment + (investment * bond.interestRate) / 100;
          expect(result.values[12]).toBeCloseTo(expectedMonth12, 6);
        }
      });
    });

    it('supports early redemption simulation for all redeemable configured bonds', () => {
      Constants.BONDS.forEach((bond) => {
        if (bond.durationMonths <= 1) {
          return;
        }

        const redemptionMonth = Math.floor(bond.durationMonths / 2);
        const result = service.simulateEarlyRedemption(bond, 1000, redemptionMonth, 5);

        expect(result.redemptionMonth).toBe(redemptionMonth);
        expect(Number.isFinite(result.valueAtRedemption)).toBe(true);
        expect(Number.isFinite(result.netProceeds)).toBe(true);
        expect(result.earlyRedemptionFee).toBeGreaterThanOrEqual(0);
        expect(result.tax).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
export enum BondType {
  OTS = 'OTS', // 3-month fixed
  ROR = 'ROR', // 1-year floating
  DOR = 'DOR', // 2-year floating
  TOS = 'TOS', // 3-year fixed
  COI = 'COI', // 4-year indexed to inflation
  EDO = 'EDO', // 10-year indexed to inflation
}

export interface Bond {
  type: BondType;
  name: string;
  description: string;
  interestRate: number; // Initial rate in %
  durationMonths: number;
  isIndexedToInflation: boolean;
  capitalizationFreqMonths: number; // 12 for annual, 1 for monthly (if any), 0 for at maturity
  earlyRedemptionFee: number; // Fee in PLN per 100 PLN unit if redeemed early (simplified)
}

export class Constants {
  static readonly TAX_RATE = 0.19; // Belka tax
  static readonly CHART_DEBOUNCE_MS = 500;

  static readonly BONDS: Bond[] = [
    {
      type: BondType.OTS,
      name: '3-miesięczne',
      description: 'Oszczędnościowe Trzymiesięczne Stałoprocentowe',
      interestRate: 2.5,
      durationMonths: 3,
      isIndexedToInflation: false,
      capitalizationFreqMonths: 0, // At maturity
      earlyRedemptionFee: 0,
    },
    {
      type: BondType.ROR,
      name: 'Roczne',
      description: 'Roczne Oszczędnościowe Referencyjne',
      interestRate: 4.25,
      durationMonths: 12,
      isIndexedToInflation: false, // Floating but not inflation indexed directly (NBP reference rate)
      capitalizationFreqMonths: 1, // Monthly payment
      earlyRedemptionFee: 0.5,
    },
    {
      type: BondType.DOR,
      name: '2-letnie',
      description: 'Dwuletnie Oszczędnościowe Referencyjne',
      interestRate: 4.4,
      durationMonths: 24,
      isIndexedToInflation: false, // Floating (NBP reference rate)
      capitalizationFreqMonths: 1, // Monthly payment
      earlyRedemptionFee: 0.7,
    },
    {
      type: BondType.TOS,
      name: '3-letnie',
      description: 'Trzyletnie Oszczędnościowe Stałoprocentowe',
      interestRate: 4.65,
      durationMonths: 36,
      isIndexedToInflation: false,
      capitalizationFreqMonths: 12, // Annual capitalization
      earlyRedemptionFee: 0.7,
    },
    {
      type: BondType.COI,
      name: '4-letnie',
      description: 'Czteroletnie Oszczędnościowe Indeksowane Inflacją',
      interestRate: 5, // First year fixed
      durationMonths: 48,
      isIndexedToInflation: true,
      capitalizationFreqMonths: 12, // Annual payment
      earlyRedemptionFee: 0.7,
    },
    {
      type: BondType.EDO,
      name: '10-letnie',
      description: 'Emerytalne Dziesięcioletnie Oszczędnościowe',
      interestRate: 5.6, // First year fixed
      durationMonths: 120,
      isIndexedToInflation: true,
      capitalizationFreqMonths: 12, // Annual capitalization
      earlyRedemptionFee: 2.0,
    },
  ];
}

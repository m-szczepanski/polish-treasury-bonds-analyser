import { TestBed } from '@angular/core/testing';
import { BondCalculatorService } from '../logic/bond-calculator';
import { ChartConfigService } from '../logic/chart-config.service';
import { BondType, Constants } from '../logic/constants';
import { StrategyCalculatorService } from '../logic/strategy-calculator';
import { UI_DEFAULTS } from '../logic/ui-defaults';
import {
  BondStrategyConfig,
  InvestmentStrategyFacadeService,
} from './investment-strategy-facade.service';

describe('InvestmentStrategyFacadeService', () => {
  let service: InvestmentStrategyFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InvestmentStrategyFacadeService,
        StrategyCalculatorService,
        BondCalculatorService,
        ChartConfigService,
      ],
    });

    service = TestBed.inject(InvestmentStrategyFacadeService);
  });

  const byType = (configs: BondStrategyConfig[], bondType: BondType) =>
    configs.find((config) => config.bond.type === bondType)!;

  it('creates initial configurations from bonds with UI defaults', () => {
    const configs = service.createInitialConfigurations();

    expect(configs.length).toBe(Constants.BONDS.length);
    expect(configs.every((config) => config.isSelected === false)).toBe(true);
    expect(configs.every((config) => config.initialAmount === UI_DEFAULTS.STRATEGY_INITIAL_AMOUNT)).toBe(true);
    expect(configs.every((config) => config.recurringAmount === UI_DEFAULTS.STRATEGY_RECURRING_AMOUNT)).toBe(true);
    expect(configs.every((config) => config.reinvest === UI_DEFAULTS.STRATEGY_REINVEST)).toBe(true);
  });

  it('toggles one bond selection immutably', () => {
    const configs = service.createInitialConfigurations();

    const updated = service.toggleBondSelection(configs, BondType.OTS);

    expect(updated).not.toBe(configs);
    expect(byType(configs, BondType.OTS).isSelected).toBe(false);
    expect(byType(updated, BondType.OTS).isSelected).toBe(true);
    expect(byType(updated, BondType.ROR).isSelected).toBe(false);
  });

  it('updates numeric and boolean config fields for a selected bond', () => {
    const configs = service.createInitialConfigurations();

    const afterAmount = service.updateConfigValue(
      configs,
      BondType.ROR,
      'recurringAmount',
      '1200' as unknown as number
    );

    const afterReinvest = service.updateConfigValue(afterAmount, BondType.ROR, 'reinvest', false);

    expect(byType(afterAmount, BondType.ROR).recurringAmount).toBe(1200);
    expect(byType(afterReinvest, BondType.ROR).reinvest).toBe(false);
    expect(byType(afterReinvest, BondType.OTS).recurringAmount).toBe(UI_DEFAULTS.STRATEGY_RECURRING_AMOUNT);
  });

  it('keeps configurations unchanged when bond type does not exist', () => {
    const configs = service.createInitialConfigurations();

    const updated = service.toggleBondSelection(configs, 'UNKNOWN' as BondType);

    expect(updated).not.toBe(configs);
    expect(updated).toEqual(configs);
  });

  it('returns null simulation for invalid inputs or no active bonds', () => {
    const base = service.createInitialConfigurations();

    const noSelected = service.calculateSimulation(1, 12, 2.4, base);
    const invalidFrequency = service.calculateSimulation(0, 12, 2.4, service.toggleBondSelection(base, BondType.OTS));
    const invalidAmountConfig = service.updateConfigValue(base, BondType.OTS, 'initialAmount', -1);
    const invalidAmount = service.calculateSimulation(1, 12, 2.4, service.toggleBondSelection(invalidAmountConfig, BondType.OTS));

    expect(noSelected).toBeNull();
    expect(invalidFrequency).toBeNull();
    expect(invalidAmount).toBeNull();
  });

  it('aggregates simulation data for multiple selected bonds', () => {
    let configs = service.createInitialConfigurations();
    configs = service.toggleBondSelection(configs, BondType.OTS);
    configs = service.toggleBondSelection(configs, BondType.ROR);
    configs = service.updateConfigValue(configs, BondType.OTS, 'initialAmount', 3000);
    configs = service.updateConfigValue(configs, BondType.ROR, 'initialAmount', 4000);

    const result = service.calculateSimulation(1, 24, Constants.INFLATION_RATE, configs);

    expect(result).toBeDefined();
    expect(result?.simulations.length).toBe(2);
    expect(result?.months.length).toBe(result?.totalValue.length);
    expect(result?.months.length).toBe(result?.totalInvested.length);
    expect(result?.totalInvested[result.totalInvested.length - 1]).toBeGreaterThan(0);
    expect(result?.totalValue[result.totalValue.length - 1]).toBeGreaterThan(0);
  });

  it('creates summary and individual charts with stable shape', () => {
    let configs = service.createInitialConfigurations();
    configs = service.toggleBondSelection(configs, BondType.OTS);

    const result = service.calculateSimulation(1, 12, Constants.INFLATION_RATE, configs);
    expect(result).toBeDefined();

    const summaryChart = service.createSummaryChart(result!);
    const simulation = result!.simulations[0];
    const individualChart = service.createIndividualChart(simulation.config, simulation.result);

    expect(summaryChart.title).toBe('Podsumowanie Portfela');
    expect(summaryChart.data.datasets.length).toBe(2);
    expect(summaryChart.data.labels?.length).toBe(result?.months.length);

    expect(individualChart.title).toBe(simulation.config.bond.name);
    expect(individualChart.data.datasets.length).toBe(2);
    expect(individualChart.data.labels?.length).toBe(simulation.result.months.length);
  });
});

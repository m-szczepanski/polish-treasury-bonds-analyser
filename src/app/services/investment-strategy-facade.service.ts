import { Injectable, inject } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { StrategyCalculatorService, StrategyResult } from '../logic/strategy-calculator';
import { Bond, BondType, Constants } from '../logic/constants';
import { ChartConfigService } from '../logic/chart-config.service';
import { UI_DEFAULTS } from '../logic/ui-defaults';

export interface BondStrategyConfig {
  bond: Bond;
  isSelected: boolean;
  initialAmount: number;
  recurringAmount: number;
  reinvest: boolean;
}

interface SimulatedBond {
  config: BondStrategyConfig;
  result: StrategyResult;
}

export interface AggregatedStrategyResult {
  months: number[];
  totalValue: number[];
  totalInvested: number[];
  totalProfit: number;
  netProfit: number;
  simulations: SimulatedBond[];
}

export interface ChartSet {
  title: string;
  data: ChartConfiguration['data'];
  options: ChartConfiguration['options'];
}

@Injectable({
  providedIn: 'root',
})
export class InvestmentStrategyFacadeService {
  private readonly strategyCalculator = inject(StrategyCalculatorService);
  private readonly chartConfig = inject(ChartConfigService);

  createInitialConfigurations(): BondStrategyConfig[] {
    return Constants.BONDS.map((bond) => ({
      bond,
      isSelected: false,
      initialAmount: UI_DEFAULTS.STRATEGY_INITIAL_AMOUNT,
      recurringAmount: UI_DEFAULTS.STRATEGY_RECURRING_AMOUNT,
      reinvest: UI_DEFAULTS.STRATEGY_REINVEST,
    }));
  }

  toggleBondSelection(configurations: BondStrategyConfig[], bondType: BondType): BondStrategyConfig[] {
    return this.updateConfiguration(configurations, bondType, (config) => ({
      ...config,
      isSelected: !config.isSelected,
    }));
  }

  updateConfigValue<K extends keyof BondStrategyConfig>(
    configurations: BondStrategyConfig[],
    bondType: BondType,
    field: K,
    value: BondStrategyConfig[K]
  ): BondStrategyConfig[] {
    const finalValue =
      field === 'initialAmount' || field === 'recurringAmount'
        ? (Number(value) as BondStrategyConfig[K])
        : value;

    return this.updateConfiguration(configurations, bondType, (config) => ({
      ...config,
      [field]: finalValue,
    }));
  }

  calculateSimulation(
    frequencyMonths: number,
    durationMonths: number,
    inflationRate: number,
    configurations: BondStrategyConfig[]
  ): AggregatedStrategyResult | null {
    if (frequencyMonths <= 0 || durationMonths <= 0 || inflationRate < 0) return null;

    const activeConfigs = configurations.filter((config) => config.isSelected);
    if (activeConfigs.length === 0) return null;

    for (const config of activeConfigs) {
      if (config.initialAmount < 0 || config.recurringAmount < 0) return null;
    }

    const simulations = activeConfigs.map((config) => ({
      config,
      result: this.strategyCalculator.simulate({
        bond: config.bond,
        initialAmount: config.initialAmount,
        recurringAmount: config.recurringAmount,
        frequencyMonths,
        durationMonths,
        inflationRate,
        reinvest: config.reinvest,
      }),
    }));

    const baseResult = simulations[0].result;
    const totalValue = new Array(baseResult.months.length).fill(0);
    const totalInvested = new Array(baseResult.months.length).fill(0);
    let totalProfit = 0;
    let netProfit = 0;

    for (let monthIndex = 0; monthIndex < baseResult.months.length; monthIndex++) {
      for (const simulation of simulations) {
        if (monthIndex < simulation.result.totalValue.length) {
          totalValue[monthIndex] += simulation.result.totalValue[monthIndex];
          totalInvested[monthIndex] += simulation.result.totalInvested[monthIndex];
        }
      }
    }

    for (const simulation of simulations) {
      totalProfit += simulation.result.totalProfit;
      netProfit += simulation.result.netProfit;
    }

    return {
      months: baseResult.months,
      totalValue,
      totalInvested,
      totalProfit,
      netProfit,
      simulations,
    };
  }

  createSummaryChart(result: AggregatedStrategyResult): ChartSet {
    return this.createChart(result, 'Podsumowanie Portfela');
  }

  createIndividualChart(config: BondStrategyConfig, result: StrategyResult): ChartSet {
    return this.createChart(result, config.bond.name);
  }

  private updateConfiguration(
    configurations: BondStrategyConfig[],
    bondType: BondType,
    updater: (config: BondStrategyConfig) => BondStrategyConfig
  ): BondStrategyConfig[] {
    return configurations.map((config) =>
      config.bond.type === bondType ? updater(config) : config
    );
  }

  private createChart(result: StrategyResult, title: string): ChartSet {
    const labels = result.months.map((month) => `M${month}`);
    const valueDataset = this.chartConfig.getDataset('Całkowita wartość', result.totalValue, true, true);
    const investedDataset = this.chartConfig.getDataset(
      'Wpłacony kapitał',
      result.totalInvested,
      false,
      false,
      [5, 5]
    );

    return {
      title,
      data: {
        labels,
        datasets: [valueDataset, investedDataset],
      } as ChartConfiguration<'line'>['data'],
      options: this.chartConfig.defaultBaseChartOptions,
    };
  }
}

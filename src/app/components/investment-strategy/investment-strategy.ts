import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Bond, Constants } from '../../logic/constants';
import { StrategyCalculatorService, StrategyResult } from '../../logic/strategy-calculator';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfigService } from '../../logic/chart-config.service';

export interface BondStrategyConfig {
    bond: Bond;
    isSelected: boolean;
    initialAmount: number;
    recurringAmount: number;
    reinvest: boolean;
}

export interface ChartSet {
    title: string;
    data: ChartConfiguration['data'];
    options: ChartConfiguration['options'];
}

@Component({
    selector: 'app-investment-strategy',
    standalone: true,
    imports: [CommonModule, FormsModule, BaseChartDirective],
    templateUrl: './investment-strategy.html',
    styleUrl: './investment-strategy.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentStrategyComponent {
    private strategyCalculator = inject(StrategyCalculatorService);
    private chartConfig = inject(ChartConfigService);

    frequencyMonths = signal(1);
    durationMonths = signal(12);
    inflationRate = signal(4.5);

    configurations = signal<BondStrategyConfig[]>(this.initializeConfigurations());

    simulation = computed(() => {
        const freq = this.frequencyMonths();
        const dur = this.durationMonths();
        const infl = this.inflationRate();
        const configs = this.configurations();

        return this.performCalculation(freq, dur, infl, configs);
    });

    summaryChart = computed(() => {
        const res = this.simulation();
        if (!res) return null;
        return this.createSummaryChart(res);
    });

    individualCharts = computed(() => {
        const res = this.simulation();
        if (!res || res.simulations.length <= 1) return [];
        return res.simulations.map(s => this.createIndividualChart(s.config, s.result));
    });

    public lineChartType: ChartType = 'line';

    constructor() {
    }

    private initializeConfigurations(): BondStrategyConfig[] {
        return Constants.BONDS.map(bond => ({
            bond,
            isSelected: false,
            initialAmount: 10000,
            recurringAmount: 500,
            reinvest: true
        }));
    }

    updateParameter(key: 'freq' | 'dur' | 'infl', value: number) {
        if (key === 'freq') this.frequencyMonths.set(value);
        if (key === 'dur') this.durationMonths.set(value);
        if (key === 'infl') this.inflationRate.set(value);
    }

    toggleBond(config: BondStrategyConfig) {
        const current = this.configurations();
        const index = current.indexOf(config);
        if (index > -1) {
            const updated = [...current];
            updated[index] = { ...config, isSelected: !config.isSelected };
            this.configurations.set(updated);
        }
    }

    updateConfigValue<K extends keyof BondStrategyConfig>(config: BondStrategyConfig, field: K, value: BondStrategyConfig[K]) {
        const current = this.configurations();
        const index = current.indexOf(config);
        if (index > -1) {
            const updated = [...current];
            updated[index] = { ...config, [field]: value };
            this.configurations.set(updated);
        }
    }

    private performCalculation(frequencyMonths: number, durationMonths: number, inflationRate: number, configurations: BondStrategyConfig[]) {
        if (frequencyMonths <= 0 || durationMonths <= 0 || inflationRate < 0) return null;

        const activeConfigs = configurations.filter(c => c.isSelected);
        if (activeConfigs.length === 0) return null;

        for (const config of activeConfigs) {
            if (config.initialAmount < 0 || config.recurringAmount < 0) return null;
        }

        const simulations = activeConfigs.map(config => {
            return {
                config,
                result: this.strategyCalculator.simulate({
                    bond: config.bond,
                    initialAmount: config.initialAmount,
                    recurringAmount: config.recurringAmount,
                    frequencyMonths: frequencyMonths,
                    durationMonths: durationMonths,
                    inflationRate: inflationRate,
                    reinvest: config.reinvest
                })
            };
        });

        const baseResult = simulations[0].result;
        const totalValue = new Array(baseResult.months.length).fill(0);
        const totalInvested = new Array(baseResult.months.length).fill(0);
        let aggTotalProfit = 0;
        let aggNetProfit = 0;

        for (let i = 0; i < baseResult.months.length; i++) {
            simulations.forEach(sim => {
                if (i < sim.result.totalValue.length) {
                    totalValue[i] += sim.result.totalValue[i];
                    totalInvested[i] += sim.result.totalInvested[i];
                }
            });
        }

        simulations.forEach(sim => {
            aggTotalProfit += sim.result.totalProfit;
            aggNetProfit += sim.result.netProfit;
        });

        return {
            months: baseResult.months,
            totalValue,
            totalInvested,
            totalProfit: aggTotalProfit,
            netProfit: aggNetProfit,
            simulations
        };
    }

    private createSummaryChart(result: StrategyResult): ChartSet {
        const labels = result.months.map((m: number) => `M${m}`);
        const dsValue = this.chartConfig.getDataset('Całkowita wartość', result.totalValue, true, true);
        const dsInvested = this.chartConfig.getDataset('Wpłacony kapitał', result.totalInvested, false, false, [5, 5]);

        return {
            title: 'Podsumowanie Portfela',
            data: {
                datasets: [dsValue, dsInvested],
                labels
            },
            options: this.chartConfig.defaultBaseChartOptions
        };
    }

    private createIndividualChart(config: BondStrategyConfig, result: StrategyResult): ChartSet {
        const labels = result.months.map((m: number) => `M${m}`);
        const dsValue = this.chartConfig.getDataset('Całkowita wartość', result.totalValue, true, true);
        const dsInvested = this.chartConfig.getDataset('Wpłacony kapitał', result.totalInvested, false, false, [5, 5]);

        return {
            title: config.bond.name,
            data: { datasets: [dsValue, dsInvested], labels },
            options: this.chartConfig.defaultBaseChartOptions
        };
    }

    get totalProfit(): number {
        return this.simulation()?.totalProfit ?? 0;
    }

    get netProfit(): number {
        return this.simulation()?.netProfit ?? 0;
    }

    get totalInvestedSum(): number {
        const res = this.simulation();
        if (!res) return 0;
        return res.totalInvested[res.totalInvested.length - 1];
    }

    get totalValueSum(): number {
        const res = this.simulation();
        if (!res) return 0;
        return res.totalValue[res.totalValue.length - 1];
    }
}


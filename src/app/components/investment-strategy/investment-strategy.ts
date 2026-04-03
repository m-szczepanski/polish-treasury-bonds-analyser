import { Component, ChangeDetectionStrategy, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Bond, BondType, Constants } from '../../logic/constants';
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

interface SimulatedBond {
    config: BondStrategyConfig;
    result: StrategyResult;
}

interface AggregatedStrategyResult {
    months: number[];
    totalValue: number[];
    totalInvested: number[];
    totalProfit: number;
    netProfit: number;
    simulations: SimulatedBond[];
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
    private platformId = inject(PLATFORM_ID);
    isBrowser = isPlatformBrowser(this.platformId);

    frequencyMonths = signal(1);
    durationMonths = signal(12);
    inflationRate = signal(Constants.INFLATION_RATE);

    configurations = signal<BondStrategyConfig[]>(this.initializeConfigurations());

    simulation = computed<AggregatedStrategyResult | null>(() => {
        const freq = this.frequencyMonths();
        const dur = this.durationMonths();
        const infl = this.inflationRate();
        const configs = this.configurations();

        return this.performCalculation(freq, dur, infl, configs);
    });

    debouncedSimulation = toSignal(
        toObservable(this.simulation).pipe(
            debounceTime(this.isBrowser ? Constants.CHART_DEBOUNCE_MS : 0)
        ),
        { initialValue: this.simulation() }
    );

    summaryChart = computed(() => {
        const res = this.debouncedSimulation();
        if (!res) return null;
        return this.createSummaryChart(res);
    });

    individualCharts = computed(() => {
        const res = this.debouncedSimulation();
        if (!res || res.simulations.length <= 1) return [];
        return res.simulations.map(s => this.createIndividualChart(s.config, s.result));
    });

    public lineChartType: ChartType = 'line';

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
        switch (key) {
            case 'freq':
                this.frequencyMonths.set(Number(value));
                break;
            case 'dur':
                this.durationMonths.set(Number(value));
                break;
            case 'infl':
                this.inflationRate.set(Number(value));
                break;
        }
    }

    toggleBond(bondType: BondType) {
        this.updateConfiguration(bondType, config => ({ ...config, isSelected: !config.isSelected }));
    }

    updateConfigValue<K extends keyof BondStrategyConfig>(bondType: BondType, field: K, value: BondStrategyConfig[K]) {
        let finalValue: BondStrategyConfig[K];
        if (field === 'initialAmount' || field === 'recurringAmount') {
            finalValue = Number(value) as BondStrategyConfig[K];
        } else {
            finalValue = value;
        }

        this.updateConfiguration(bondType, config => ({ ...config, [field]: finalValue }));
    }

    private updateConfiguration(
        bondType: BondType,
        updater: (config: BondStrategyConfig) => BondStrategyConfig
    ) {
        this.configurations.update(current =>
            current.map(config => (config.bond.type === bondType ? updater(config) : config))
        );
    }

    private performCalculation(
        frequencyMonths: number,
        durationMonths: number,
        inflationRate: number,
        configurations: BondStrategyConfig[]
    ): AggregatedStrategyResult | null {
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

    private createSummaryChart(result: AggregatedStrategyResult): ChartSet {
        return this.createChart(result, 'Podsumowanie Portfela');
    }

    private createIndividualChart(config: BondStrategyConfig, result: StrategyResult): ChartSet {
        return this.createChart(result, config.bond.name);
    }

    private createChart(result: StrategyResult, title: string): ChartSet {
        const labels = result.months.map((m: number) => `M${m}`);
        const dsValue = this.chartConfig.getDataset('Całkowita wartość', result.totalValue, true, true);
        const dsInvested = this.chartConfig.getDataset('Wpłacony kapitał', result.totalInvested, false, false, [5, 5]);

        return {
            title,
            data: {
                datasets: [dsValue, dsInvested],
                labels
            } as ChartConfiguration<'line'>['data'],
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


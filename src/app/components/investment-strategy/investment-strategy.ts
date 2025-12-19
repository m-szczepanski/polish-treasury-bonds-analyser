import { Component, ChangeDetectionStrategy, inject, signal, effect, computed } from '@angular/core';
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

    // Signals for simplified state (could use ModelSignal for two-way binding with specific implementation, 
    // but for now simple Signals + setters or method triggers work well with standard FormsModule if using [ngModel])
    // Actually FormsModule works best with simple properties unless using signal-based forms. 
    // Detailed Refactor: Keep properties for ngModel but use Signals for internal reactivity? 
    // OR: Use Signals and manual event handling.
    // EASIEST PATH for ngModel: Keep primitive properties, but call methods that set signals.
    // OR: Use `model()` signal if on Angular 17.2+. Assuming modern Angular as per prompt (Angular 21?! Package.json said 19/21?).
    // Let's stick to properties + signal triggers for calculation or `signal()` and use `.set()`.

    // Going with standard properties bound to ngModel, but using a signal to trigger calculation effect?
    // Let's make "configurations" a signal?

    frequencyMonths = signal(1);
    durationMonths = signal(12);
    inflationRate = signal(4.5);

    // Configurations state - array of objects.
    // Since objects are mutable, we need careful handling or immutable updates.
    configurations = signal<BondStrategyConfig[]>(this.initializeConfigurations());

    // Computed result
    simulation = computed(() => {
        const freq = this.frequencyMonths();
        const dur = this.durationMonths();
        const infl = this.inflationRate();
        const configs = this.configurations();

        // Debounce? computed is synchronous. 
        // If we want debounce, we might need an effect that writes to a signal after delay.
        // For simpler archi, let's keep debounce logic or assume Signals are fast enough for this calc size.
        // But UI input (slider) can spam. 
        // Let's compute SIMULATIONS synchronously but update CHART signals debounced?
        // Or just implement debounce via RxJS toSignal?

        // Let's do: Effect observes [freq, dur, infl, configs] -> sets a "debouncedTrigger" signal?
        // Actually, just calculating strategy is fast. Chart rendering is slow.

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
        // No manual calculate() call needed, computed signals derive state automatically.
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

    // Methods bound to UI events (sliders, checkboxes)
    // Since we use signals for primitives, we need (ngModelChange).
    // Or getters/setters wrapping signals for ngModel?
    // Let's use getters/setters for cleaner HTML if we don't change HTML much.
    // Or just update HTML to use [ngModel]="val()" (ngModelChange)="val.set($event)".

    updateKwargs(key: 'freq' | 'dur' | 'infl', value: number) {
        if (key === 'freq') this.frequencyMonths.set(value);
        if (key === 'dur') this.durationMonths.set(value);
        if (key === 'infl') this.inflationRate.set(value);
    }

    toggleBond(config: BondStrategyConfig) {
        // We need to update the configuration array immutably to trigger signal
        const current = this.configurations();
        const index = current.indexOf(config);
        if (index > -1) {
            const updated = [...current];
            updated[index] = { ...config, isSelected: !config.isSelected };
            this.configurations.set(updated);
        }
    }

    updateConfigValue(config: BondStrategyConfig, field: keyof BondStrategyConfig, value: any) {
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
            simulations // Keep individual ref
        };
    }

    private createSummaryChart(result: any): ChartSet {
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

    // Getters for template to avoid calling signals directly? No, template can call signals.
    // Propierty getter for result
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


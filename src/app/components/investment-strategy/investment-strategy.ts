import { Component, ChangeDetectionStrategy, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BondType, Constants } from '../../logic/constants';
import { ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import {
    BondStrategyConfig,
    InvestmentStrategyFacadeService,
} from '../../services/investment-strategy-facade.service';
import { createDebouncedSignal } from '../../logic/signal-utils';
import { UI_DEFAULTS } from '../../logic/ui-defaults';

@Component({
    selector: 'app-investment-strategy',
    standalone: true,
    imports: [CommonModule, FormsModule, BaseChartDirective],
    templateUrl: './investment-strategy.html',
    styleUrl: './investment-strategy.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentStrategyComponent {
    private readonly strategyFacade = inject(InvestmentStrategyFacadeService);
    private readonly platformId = inject(PLATFORM_ID);
    readonly isBrowser = isPlatformBrowser(this.platformId);

    readonly frequencyMonths = signal<number>(UI_DEFAULTS.STRATEGY_FREQUENCY_MONTHS);
    readonly durationMonths = signal<number>(UI_DEFAULTS.STRATEGY_DURATION_MONTHS);
    readonly inflationRate = signal<number>(UI_DEFAULTS.STRATEGY_INFLATION_RATE);

    readonly configurations = signal<BondStrategyConfig[]>(this.strategyFacade.createInitialConfigurations());

    readonly simulation = computed(() =>
        this.strategyFacade.calculateSimulation(
            this.frequencyMonths(),
            this.durationMonths(),
            this.inflationRate(),
            this.configurations()
        )
    );

    readonly debouncedSimulation = createDebouncedSignal(
        this.simulation,
        Constants.CHART_DEBOUNCE_MS,
        this.isBrowser,
        this.simulation()
    );

    readonly summaryChart = computed(() => {
        const res = this.debouncedSimulation();
        if (!res) return null;
        return this.strategyFacade.createSummaryChart(res);
    });

    readonly individualCharts = computed(() => {
        const res = this.debouncedSimulation();
        if (!res || res.simulations.length <= 1) return [];
        return res.simulations.map((simulation) =>
            this.strategyFacade.createIndividualChart(simulation.config, simulation.result)
        );
    });

    readonly lineChartType: ChartType = 'line';

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
        this.configurations.update((current) =>
            this.strategyFacade.toggleBondSelection(current, bondType)
        );
    }

    updateConfigValue<K extends keyof BondStrategyConfig>(bondType: BondType, field: K, value: BondStrategyConfig[K]) {
        this.configurations.update((current) =>
            this.strategyFacade.updateConfigValue(current, bondType, field, value)
        );
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


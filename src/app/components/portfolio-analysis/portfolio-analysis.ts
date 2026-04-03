import { Component, ChangeDetectionStrategy, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Bond, BondType, Constants } from '../../logic/constants';
import { BondCalculatorService, SimulationResult } from '../../logic/bond-calculator';
import { ChartConfigService } from '../../logic/chart-config.service';

interface PortfolioItem {
    bondType: BondType;
    amount: number;
}

interface PortfolioSummary {
    totalInvestment: number;
    totalProfit: number;
    tax: number;
    netProfit: number;
}

interface SimulatedPortfolioItem {
    item: PortfolioItem;
    bond: Bond;
    maturitySimulation: SimulationResult;
    grossProfit: number;
    netProfit: number;
    tax: number;
}

interface PortfolioCalculationResult {
    summary: PortfolioSummary;
    compositionMap: Map<BondType, number>;
    simulatedItems: SimulatedPortfolioItem[];
}

@Component({
    selector: 'app-portfolio-analysis',
    standalone: true,
    imports: [CommonModule, FormsModule, BaseChartDirective],
    templateUrl: './portfolio-analysis.html',
    styleUrl: './portfolio-analysis.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioAnalysisComponent {
    private bondCalculator = inject(BondCalculatorService);
    private chartConfig = inject(ChartConfigService);
    private platformId = inject(PLATFORM_ID);
    private readonly analysisInflationRate = 5.0;
    private readonly defaultPortfolioItem: PortfolioItem = { bondType: BondType.OTS, amount: 1000 };
    private readonly bondsByType = new Map(Constants.BONDS.map(bond => [bond.type, bond] as const));
    isBrowser = isPlatformBrowser(this.platformId);

    availableBonds = Constants.BONDS;

    portfolio = signal<PortfolioItem[]>([{ ...this.defaultPortfolioItem }]);
    investmentHorizon = signal<number>(12);

    calculationResult = computed<PortfolioCalculationResult>(() => {
        const items = this.portfolio();
        const horizon = this.investmentHorizon();
        const summary: PortfolioSummary = { totalInvestment: 0, totalProfit: 0, tax: 0, netProfit: 0 };
        const compositionMap = new Map<BondType, number>();
        const simulatedItems: SimulatedPortfolioItem[] = [];

        for (const item of items) {
            summary.totalInvestment += item.amount;
            const currentAmount = compositionMap.get(item.bondType) || 0;
            compositionMap.set(item.bondType, currentAmount + item.amount);

            const bond = this.bondsByType.get(item.bondType);
            if (!bond) {
                continue;
            }

            const maturitySimulation = this.bondCalculator.simulate(
                bond,
                item.amount,
                this.analysisInflationRate
            );
            const { grossProfit, netProfit, tax } = this.calculateProfitAtHorizon(
                bond,
                item.amount,
                horizon,
                maturitySimulation
            );

            summary.totalProfit += grossProfit;
            summary.netProfit += netProfit;
            summary.tax += tax;

            simulatedItems.push({ item, bond, maturitySimulation, grossProfit, netProfit, tax });
        }

        return {
            summary,
            compositionMap,
            simulatedItems
        };
    });

    debouncedResult = toSignal(
        toObservable(this.calculationResult).pipe(
            debounceTime(this.isBrowser ? Constants.CHART_DEBOUNCE_MS : 0)
        ),
        { initialValue: this.calculationResult() }
    );

    summary = computed(() => this.calculationResult().summary);

    optimizationTip = computed(() => {
        const horizon = this.investmentHorizon();
        const items = this.portfolio();

        if (horizon <= 3) {
            if (items.some(p => p.bondType !== BondType.OTS)) {
                return 'Dla bardzo krótkiego okresu (do 3 miesięcy) obligacje OTS są zazwyczaj najlepsze, gdyż nie mają opłaty za wcześniejszy wykup.';
            }
            return 'Twój portfel wygląda optymalnie dla krótkiego horyzontu czasowego.';
        }

        if (horizon >= 12 && horizon < 36) {
            if (items.some(p => p.bondType === BondType.OTS)) {
                return 'Dla okresu powyżej roku, obligacje indeksowane inflacją (np. COI) mogą przynieść wyższy zysk niż krótkoterminowe OTS.';
            }
            return 'Dla średniego horyzontu warto rozważyć dywersyfikację między obligacjami stałoprocentowymi a indeksowanymi inflacją.';
        }

        return 'Dla długiego horyzontu (powyżej 3 lat) obligacje EDO (10-letnie) zazwyczaj oferują najlepszy zwrot dzięki procentowi składanemu.';
    });

    // Charts
    pieChartType: ChartType = 'pie';
    profitChartType: ChartType = 'line';

    pieChartData = computed<ChartData<'pie', number[], string | string[]>>(() => {
        const res = this.debouncedResult();
        if (!res) return { labels: [], datasets: [] };
        const map = res.compositionMap;
        const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];

        return {
            labels: Array.from(map.keys()),
            datasets: [{
                data: Array.from(map.values()),
                backgroundColor: Array.from(map.keys()).map((_, i) => colors[i % colors.length])
            }]
        };
    });

    profitChartData = computed<ChartData<'line'>>(() => {
        const res = this.debouncedResult();
        if (!res) return { labels: [], datasets: [] };

        const horizon = this.investmentHorizon();
        const months = Array.from({ length: horizon + 1 }, (_, i) => i);
        const timelineValues = new Array(horizon + 1).fill(0);

        res.simulatedItems.forEach(simulatedItem => {
            const simValues = simulatedItem.maturitySimulation.values;
            const finalValue = simValues[simValues.length - 1] ?? 0;

            for (let m = 0; m <= horizon; m++) {
                const val = m < simValues.length ? simValues[m] : finalValue;
                timelineValues[m] += val;
            }
        });

        const dataset = this.chartConfig.getDataset(
            'Wartość Portfela (PLN)',
            timelineValues,
            true,
            true
        );

        return {
            labels: months.map(m => `M${m}`),
            datasets: [dataset]
        };
    });

    pieChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right' } }
    };

    profitChartOptions: ChartConfiguration['options'] = this.chartConfig.defaultBaseChartOptions;

    addBond() {
        this.portfolio.update(curr => [...curr, { ...this.defaultPortfolioItem }]);
    }

    removeBond(index: number) {
        this.portfolio.update(curr => {
            if (curr.length <= 1) return curr;
            return curr.filter((_, i) => i !== index);
        });
    }

    updateBondType(index: number, type: BondType) {
        this.updatePortfolioItem(index, item => ({ ...item, bondType: type }));
    }

    updateBondAmount(index: number, amount: number) {
        this.updatePortfolioItem(index, item => ({ ...item, amount: Number(amount) }));
    }

    private updatePortfolioItem(index: number, updater: (item: PortfolioItem) => PortfolioItem) {
        this.portfolio.update(curr => curr.map((item, currentIndex) => (currentIndex === index ? updater(item) : item)));
    }

    private calculateProfitAtHorizon(
        bond: Bond,
        amount: number,
        horizon: number,
        maturitySimulation: SimulationResult
    ): Pick<SimulatedPortfolioItem, 'grossProfit' | 'netProfit' | 'tax'> {
        if (horizon > 0 && horizon < bond.durationMonths) {
            const early = this.bondCalculator.simulateEarlyRedemption(
                bond,
                amount,
                horizon,
                this.analysisInflationRate
            );

            return {
                grossProfit: early.grossProfit - early.earlyRedemptionFee,
                netProfit: early.netProfit,
                tax: early.tax
            };
        }

        const grossProfit = maturitySimulation.totalProfit;
        const netProfit = maturitySimulation.netProfit;

        return {
            grossProfit,
            netProfit,
            tax: grossProfit - netProfit
        };
    }
}

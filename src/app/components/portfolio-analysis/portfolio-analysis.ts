import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Bond, BondType, Constants } from '../../logic/constants';
import { BondCalculatorService, EarlyRedemptionResult, SimulationResult } from '../../logic/bond-calculator';
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

@Component({
    selector: 'app-portfolio-analysis',
    standalone: true,
    imports: [CommonModule, FormsModule, BaseChartDirective],
    templateUrl: './portfolio-analysis.html',
    styleUrl: './portfolio-analysis.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioAnalysisComponent implements OnInit {
    private bondCalculator = inject(BondCalculatorService);
    private chartConfig = inject(ChartConfigService);

    availableBonds = Constants.BONDS;
    portfolio: PortfolioItem[] = [];
    investmentHorizon = 12; // months

    summary: PortfolioSummary = {
        totalInvestment: 0,
        totalProfit: 0,
        tax: 0,
        netProfit: 0
    };

    optimizationTip = '';

    // Charts
    pieChartType: ChartType = 'pie';
    barChartType: ChartType = 'bar';

    pieChartData: ChartData<'pie', number[], string | string[]> = {
        labels: [],
        datasets: [{ data: [], backgroundColor: [] }]
    };

    barChartData: ChartData<'bar'> = {
        labels: [],
        datasets: [{ data: [], label: 'Zysk Netto (PLN)', backgroundColor: '#2e7d32' }]
    };

    pieChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        plugins: {
            legend: { position: 'right' }
        }
    };

    barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        scales: {
            y: { beginAtZero: true }
        },
        plugins: {
            legend: { display: false }
        }
    };

    ngOnInit() {
        this.addBond(); // Start with one empty row
        this.calculate();
    }

    addBond() {
        this.portfolio.push({ bondType: BondType.OTS, amount: 1000 });
        this.calculate();
    }

    removeBond(index: number) {
        if (this.portfolio.length > 1) {
            this.portfolio.splice(index, 1);
            this.calculate();
        }
    }

    calculate() {
        this.summary = { totalInvestment: 0, totalProfit: 0, tax: 0, netProfit: 0 };
        const compositionMap = new Map<string, number>();

        this.portfolio.forEach((item, index) => {
            // Composition
            const currentAmount = compositionMap.get(item.bondType) || 0;
            compositionMap.set(item.bondType, currentAmount + item.amount);

            this.summary.totalInvestment += item.amount;

            // Calculation
            const bond = this.availableBonds.find(b => b.type === item.bondType);
            if (bond) {
                let netProfit = 0;
                let tax = 0;
                let grossProfit = 0;

                // If horizon < duration, simulate early redemption
                if (this.investmentHorizon < bond.durationMonths) {
                    try {
                        // Use 5% inflation as default assumption
                        const result = this.bondCalculator.simulateEarlyRedemption(bond, item.amount, this.investmentHorizon, 5.0);
                        netProfit = result.netProfit;
                        tax = result.tax;
                        grossProfit = result.grossProfit - result.earlyRedemptionFee; // Effective gross after fee
                    } catch (e) {
                        console.error(e);
                    }
                } else {
                    // Full duration simulation
                    const result = this.bondCalculator.simulate(bond, item.amount, 5.0);
                    // Result arrays are 0-indexed (month 0 to duration)
                    // If horizon > duration, take last value (assuming cash hold)
                    grossProfit = result.totalProfit;
                    netProfit = result.netProfit;

                    tax = grossProfit - netProfit;
                }

                this.summary.totalProfit += grossProfit;
                this.summary.netProfit += netProfit;
                this.summary.tax += tax;
            }
        });

        // Generate Chart Data
        const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];

        // 1. Pie Chart
        this.pieChartData.labels = Array.from(compositionMap.keys());
        this.pieChartData.datasets[0].data = Array.from(compositionMap.values());
        this.pieChartData.datasets[0].backgroundColor = Array.from(compositionMap.keys()).map((_, i) => colors[i % colors.length]);

        // 2. Bar Chart (Aggregated Profit by Type)
        const profitMap = new Map<string, number>();

        this.portfolio.forEach(item => {
            const bond = this.availableBonds.find(b => b.type === item.bondType);
            if (bond) {
                let netProfit = 0;
                if (this.investmentHorizon < bond.durationMonths) {
                    try {
                        const result = this.bondCalculator.simulateEarlyRedemption(bond, item.amount, this.investmentHorizon, 5.0);
                        netProfit = result.netProfit;
                    } catch { }
                } else {
                    const result = this.bondCalculator.simulate(bond, item.amount, 5.0);
                    netProfit = result.netProfit;
                }
                const current = profitMap.get(item.bondType) || 0;
                profitMap.set(item.bondType, current + netProfit);
            }
        });

        this.barChartData.labels = Array.from(profitMap.keys());
        this.barChartData.datasets[0].data = Array.from(profitMap.values());
        this.barChartData.datasets[0].backgroundColor = Array.from(profitMap.keys()).map((_, i) => colors[i % colors.length]);

        // Update charts
        this.pieChartData = { ...this.pieChartData };
        this.barChartData = { ...this.barChartData };

        this.generateTip();
    }

    generateTip() {
        if (this.investmentHorizon <= 3) {
            if (this.portfolio.some(p => p.bondType !== BondType.OTS)) {
                this.optimizationTip = 'Dla bardzo krótkiego okresu (do 3 miesięcy) obligacje OTS są zazwyczaj najlepsze, gdyż nie mają opłaty za wcześniejszy wykup.';
            } else {
                this.optimizationTip = 'Twój portfel wygląda optymalnie dla krótkiego horyzontu czasowego.';
            }
        } else if (this.investmentHorizon >= 12 && this.investmentHorizon < 36) {
            if (this.portfolio.some(p => p.bondType === BondType.OTS)) {
                this.optimizationTip = 'Dla okresu powyżej roku, obligacje indeksowane inflacją (np. COI) mogą przynieść wyższy zysk niż krótkoterminowe OTS.';
            } else {
                this.optimizationTip = 'Dla średniego horyzontu warto rozważyć dywersyfikację między obligacjami stałoprocentowymi a indeksowanymi inflacją.';
            }
        } else {
            this.optimizationTip = 'Dla długiego horyzontu (powyżej 3 lat) obligacje EDO (10-letnie) zazwyczaj oferują najlepszy zwrot dzięki procentowi składanemu.';
        }
    }
}

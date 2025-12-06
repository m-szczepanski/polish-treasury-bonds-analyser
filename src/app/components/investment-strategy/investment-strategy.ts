import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Bond, Constants } from '../../logic/constants';
import { StrategyCalculator, StrategyResult } from '../../logic/strategy-calculator';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

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
})
export class InvestmentStrategyComponent implements OnInit {
    frequencyMonths: number = 1;
    durationMonths: number = 12;
    inflationRate: number = 4.5;

    configurations: BondStrategyConfig[] = [];

    result: StrategyResult | null = null;

    public summaryChart: ChartSet | null = null;
    public individualCharts: ChartSet[] = [];

    public lineChartType: ChartType = 'line';

    private readonly baseChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8
                }
            },
        },
        elements: {
            point: { radius: 0 }
        },
        scales: {
            x: {
                grid: { display: false }
            }
        }
    };

    ngOnInit() {
        this.initializeConfigurations();
        this.calculate();
    }

    private initializeConfigurations() {
        this.configurations = Constants.BONDS.map(bond => ({
            bond,
            isSelected: false,
            initialAmount: 10000,
            recurringAmount: 500,
            reinvest: true
        }));
    }

    toggleBond(config: BondStrategyConfig) {
        config.isSelected = !config.isSelected;
        this.calculate();
    }

    calculate() {
        const activeConfigs = this.configurations.filter(c => c.isSelected);
        this.individualCharts = [];
        this.summaryChart = null;
        this.result = null;

        if (activeConfigs.length === 0) {
            return;
        }

        const simulations: { config: BondStrategyConfig; result: StrategyResult }[] = activeConfigs.map(config => {
            return {
                config,
                result: StrategyCalculator.simulate({
                    bond: config.bond,
                    initialAmount: config.initialAmount,
                    recurringAmount: config.recurringAmount,
                    frequencyMonths: this.frequencyMonths,
                    durationMonths: this.durationMonths,
                    inflationRate: this.inflationRate,
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

        this.result = {
            months: baseResult.months,
            totalValue,
            totalInvested,
            totalProfit: aggTotalProfit,
            netProfit: aggNetProfit
        };

        this.summaryChart = {
            title: 'Podsumowanie Portfela',
            data: {
                datasets: [
                    {
                        data: this.result.totalValue,
                        label: 'Całkowita wartość',
                        backgroundColor: 'rgba(139, 69, 19, 0.2)',
                        borderColor: 'rgba(139, 69, 19, 1)',
                        pointBackgroundColor: 'rgba(139, 69, 19, 1)',
                        pointBorderColor: '#fff',
                        fill: 'origin',
                        borderWidth: 2,
                        order: 1
                    },
                    {
                        data: this.result.totalInvested,
                        label: 'Wpłacony kapitał',
                        borderColor: 'rgba(148, 159, 177, 1)',
                        backgroundColor: 'rgba(148, 159, 177, 0.2)',
                        pointRadius: 0,
                        borderDash: [5, 5],
                        fill: false,
                        borderWidth: 2,
                        order: 2
                    }
                ],
                labels: this.result.months.map(m => `M${m}`)
            },
            options: {
                ...this.baseChartOptions,
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        ticks: {
                            callback: function (value) {
                                return value + ' zł';
                            }
                        }
                    }
                }
            }
        };

        if (simulations.length > 1) {
            simulations.forEach(sim => {
                this.individualCharts.push({
                    title: sim.config.bond.name,
                    data: {
                        datasets: [
                            {
                                data: sim.result.totalValue,
                                label: 'Całkowita wartość',
                                backgroundColor: 'rgba(139, 69, 19, 0.2)',
                                borderColor: 'rgba(139, 69, 19, 1)',
                                pointBackgroundColor: 'rgba(139, 69, 19, 1)',
                                pointBorderColor: '#fff',
                                fill: 'origin',
                                borderWidth: 2,
                                order: 1
                            },
                            {
                                data: sim.result.totalInvested,
                                label: 'Wpłacony kapitał',
                                borderColor: 'rgba(148, 159, 177, 1)',
                                backgroundColor: 'rgba(148, 159, 177, 0.2)',
                                pointRadius: 0,
                                borderDash: [5, 5],
                                fill: false,
                                borderWidth: 2,
                                order: 2
                            }
                        ],
                        labels: sim.result.months.map(m => `M${m}`)
                    },
                    options: {
                        ...this.baseChartOptions,
                        scales: {
                            x: {
                                grid: { display: false }
                            },
                            y: {
                                ticks: {
                                    callback: function (value) {
                                        return value + ' zł';
                                    }
                                }
                            }
                        }
                    }
                });
            });
        }
    }

    get totalProfit(): number {
        return this.result ? this.result.totalProfit : 0;
    }

    get netProfit(): number {
        return this.result ? this.result.netProfit : 0;
    }

    get totalInvestedSum(): number {
        if (!this.result || this.result.totalInvested.length === 0) return 0;
        return this.result.totalInvested[this.result.totalInvested.length - 1];
    }

    get totalValueSum(): number {
        if (!this.result || this.result.totalValue.length === 0) return 0;
        return this.result.totalValue[this.result.totalValue.length - 1];
    }
}

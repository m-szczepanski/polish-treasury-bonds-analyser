import { Component, computed, effect, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartDataset, ChartType } from 'chart.js';
import { Bond } from '../../logic/constants';
import { BondCalculatorService, SimulationResult } from '../../logic/bond-calculator';
import { ChartConfigService } from '../../logic/chart-config.service';

@Component({
  selector: 'app-bond-card',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './bond-card.html',
  styleUrl: './bond-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BondCardComponent {
  private bondCalculator = inject(BondCalculatorService);
  private chartConfig = inject(ChartConfigService);

  bond = input.required<Bond>();
  investmentAmount = input<number>(1000);

  simulationResult = computed(() => {
    const bond = this.bond();
    const amount = this.investmentAmount();
    if (!bond) return null;

    // Default inflation assumption 5% for simulation if indexed
    const inflation = 5.0;
    return this.bondCalculator.simulate(bond, amount, inflation);
  });

  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  public lineChartOptions: ChartConfiguration['options'] = this.chartConfig.defaultBaseChartOptions;
  public lineChartType: ChartType = 'line';

  constructor() {
    effect(() => {
      const result = this.simulationResult();
      if (result) {
        this.updateChart(result);
      }
    });
  }

  private updateChart(result: SimulationResult): void {
    const labels = result.months.map((m) => `M${m}`);

    // Get default dataset structure
    const dataset = this.chartConfig.getDataset(
      'Wartość inwestycji (PLN)',
      result.values,
      true // Use primary theme as base
    ) as unknown as ChartDataset<'line', number[]>;

    // Use default colors from config (brown)
    this.lineChartData = {
      labels,
      datasets: [dataset],
    };
  }

  get profitColor(): string {
    return (this.simulationResult()?.netProfit ?? 0) > 0 ? '#2e7d32' : '#d32f2f';
  }
}

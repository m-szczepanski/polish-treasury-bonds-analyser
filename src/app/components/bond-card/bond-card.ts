import { Component, computed, inject, input, ChangeDetectionStrategy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Bond, Constants } from '../../logic/constants';
import { BondCalculatorService, SimulationResult } from '../../logic/bond-calculator';
import { ChartConfigService } from '../../logic/chart-config.service';
import { createDebouncedSignal } from '../../logic/signal-utils';

@Component({
  selector: 'app-bond-card',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './bond-card.html',
  styleUrl: './bond-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BondCardComponent {
  private readonly bondCalculator = inject(BondCalculatorService);
  private readonly chartConfig = inject(ChartConfigService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly bond = input.required<Bond>();
  readonly investmentAmount = input<number>(1000);

  readonly simulationResult = computed(() => {
    const bond = this.bond();
    const amount = this.investmentAmount();
    if (!bond) return null;

    return this.bondCalculator.simulate(bond, amount, Constants.INFLATION_RATE);
  });

  readonly debouncedResult = createDebouncedSignal(
    this.simulationResult,
    Constants.CHART_DEBOUNCE_MS,
    this.isBrowser,
    null as SimulationResult | null
  );

  readonly resultSummary = computed(() => {
    const result = this.simulationResult();
    const totalProfit = result?.totalProfit ?? 0;
    const netProfit = result?.netProfit ?? 0;

    return {
      totalProfit,
      netProfit,
      tax: totalProfit - netProfit,
      profitColor: netProfit > 0 ? '#2e7d32' : '#d32f2f',
    };
  });

  readonly lineChartData = computed<ChartData<'line'>>(() => {
    const result = this.debouncedResult();
    if (!result) return { labels: [], datasets: [] };

    const labels = result.months.map((m) => `M${m}`);
    const dataset = this.chartConfig.getDataset<'line'>(
      'Wartość inwestycji (PLN)',
      result.values,
      true
    );

    return {
      labels,
      datasets: [dataset],
    };
  });

  readonly lineChartOptions: ChartConfiguration['options'] = this.chartConfig.defaultBaseChartOptions;
  readonly lineChartType: ChartType = 'line';
}

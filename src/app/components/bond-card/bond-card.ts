import { Component, computed, inject, input, ChangeDetectionStrategy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartDataset, ChartType } from 'chart.js';
import { Bond, Constants } from '../../logic/constants';
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
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);

  bond = input.required<Bond>();
  investmentAmount = input<number>(1000);

  simulationResult = computed(() => {
    const bond = this.bond();
    const amount = this.investmentAmount();
    if (!bond) return null;

    return this.bondCalculator.simulate(bond, amount, Constants.INFLATION_RATE);
  });

  debouncedResult = toSignal(
    toObservable(this.simulationResult).pipe(
      debounceTime(this.isBrowser ? Constants.CHART_DEBOUNCE_MS : 0)
    ), { initialValue: null as SimulationResult | null }
  );

  public lineChartData = computed<ChartData<'line'>>(() => {
    const result = this.debouncedResult();
    if (!result) return { labels: [], datasets: [] };

    const labels = result.months.map((m) => `M${m}`);
    const dataset = this.chartConfig.getDataset(
      'Wartość inwestycji (PLN)',
      result.values,
      true
    ) as unknown as ChartDataset<'line', number[]>;

    return {
      labels,
      datasets: [dataset],
    };
  });

  public lineChartOptions: ChartConfiguration['options'] = this.chartConfig.defaultBaseChartOptions;
  public lineChartType: ChartType = 'line';

  get profitColor(): string {
    return (this.simulationResult()?.netProfit ?? 0) > 0 ? '#2e7d32' : '#d32f2f';
  }
}

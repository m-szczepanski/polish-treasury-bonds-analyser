import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Bond } from '../../logic/constants';
import { BondCalculator, SimulationResult } from '../../logic/bond-calculator';

@Component({
  selector: 'app-bond-card',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './bond-card.html',
  styleUrl: './bond-card.css',
})
export class BondCardComponent implements OnInit, OnChanges {
  @Input() bond!: Bond;
  @Input() investmentAmount = 1000;
  simulationResult: SimulationResult | null = null;

  // Chart configuration
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Wartość inwestycji (PLN)',
        backgroundColor: 'rgba(139, 69, 19, 0.2)',
        borderColor: 'rgba(139, 69, 19, 1)',
        pointBackgroundColor: 'rgba(139, 69, 19, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(139, 69, 19, 0.8)',
        fill: 'origin',
      },
    ],
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    elements: {
      line: {
        tension: 0.4,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  public lineChartType: ChartType = 'line';

  ngOnInit(): void {
    this.calculate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bond'] || changes['investmentAmount']) {
      this.calculate();
    }
  }



  private calculate(): void {
    if (!this.bond) return;

    // Default inflation assumption 5% for simulation if indexed
    const inflation = 5.0;
    this.simulationResult = BondCalculator.simulate(this.bond, this.investmentAmount, inflation);

    this.updateChart();
  }

  private updateChart(): void {
    if (!this.simulationResult) return;

    this.lineChartData.labels = this.simulationResult.months.map((m) => `M${m}`);
    this.lineChartData.datasets[0].data = this.simulationResult.values;

    // Trigger chart update
    this.lineChartData = { ...this.lineChartData };
  }

  get profitColor(): string {
    return (this.simulationResult?.netProfit ?? 0) > 0 ? '#2e7d32' : '#d32f2f';
  }
}

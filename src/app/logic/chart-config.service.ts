import { Injectable } from '@angular/core';
import { ChartConfiguration, ChartDataset, ChartType } from 'chart.js';

@Injectable({
    providedIn: 'root',
})
export class ChartConfigService {
    public readonly primaryColor = 'rgba(139, 69, 19, 1)';
    public readonly primaryColorTransparent = 'rgba(139, 69, 19, 0.2)';
    public readonly secondaryColor = 'rgba(148, 159, 177, 1)';
    public readonly secondaryColorTransparent = 'rgba(148, 159, 177, 0.2)';
    public readonly pointColor = '#fff';

    public readonly defaultBaseChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                },
            },
        },
        elements: {
            point: { radius: 0 },
            line: { tension: 0.4 },
        },
        scales: {
            x: {
                grid: { display: false },
            },
            y: {
                grid: { color: 'rgba(0,0,0,0.05)' },
            },
        },
    };

    getDataset<TType extends ChartType = 'line'>(
        label: string,
        data: number[],
        isPrimary = true,
        fill = true,
        borderDash: number[] = []
    ): ChartDataset<TType, number[]> {
        return {
            data,
            label,
            backgroundColor: isPrimary ? this.primaryColorTransparent : this.secondaryColorTransparent,
            borderColor: isPrimary ? this.primaryColor : this.secondaryColor,
            pointBackgroundColor: isPrimary ? this.primaryColor : this.secondaryColor,
            pointBorderColor: this.pointColor,
            pointHoverBackgroundColor: this.pointColor,
            pointHoverBorderColor: isPrimary ? 'rgba(139, 69, 19, 0.8)' : this.secondaryColor,
            fill: fill ? 'origin' : false,
            borderWidth: 2,
            pointRadius: 0,
            borderDash,
        } as unknown as ChartDataset<TType, number[]>;
    }
}

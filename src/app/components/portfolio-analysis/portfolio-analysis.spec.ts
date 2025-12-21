import 'zone.js/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioAnalysisComponent } from './portfolio-analysis';
import { RouterTestingModule } from '@angular/router/testing';
import { BondType } from '../../logic/constants';
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'canvas[baseChart]',
    standalone: true,
    template: ''
})
class MockBaseChartDirective {
    @Input() data: any;
    @Input() options: any;
    @Input() type: any;
}

describe('PortfolioAnalysisComponent', () => {
    let component: PortfolioAnalysisComponent;
    let fixture: ComponentFixture<PortfolioAnalysisComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PortfolioAnalysisComponent, RouterTestingModule]
        })
            .overrideComponent(PortfolioAnalysisComponent, {
                set: {
                    imports: [CommonModule, FormsModule, MockBaseChartDirective]
                }
            })
            .compileComponents();

        fixture = TestBed.createComponent(PortfolioAnalysisComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default bond', () => {
        expect(component.portfolio().length).toBe(1);
        expect(component.portfolio()[0].bondType).toBe(BondType.OTS);
    });

    it('should calculate summary correctly', () => {
        // OTS 1000 PLN, 12 months horizon
        // Signals update automatically
        fixture.detectChanges();
        const summary = component.summary();
        expect(summary.totalInvestment).toBe(1000);
        expect(summary.totalProfit).toBeGreaterThan(0);
        // Tax is usually ~19% of profit
        expect(summary.tax).toBeCloseTo(summary.totalProfit * 0.19, 0);
    });

    it('should update calculation when bond added', () => {
        component.addBond();
        component.updateBondType(1, BondType.ROR);
        component.updateBondAmount(1, 2000);

        fixture.detectChanges();
        const summary = component.summary();
        const portfolio = component.portfolio();

        expect(portfolio.length).toBe(2);
        expect(summary.totalInvestment).toBe(3000);
    });

    it('should generate charts data', async () => {
        fixture.detectChanges();
        await new Promise(resolve => setTimeout(resolve, 600));
        const pieData = component.pieChartData();
        const profitData = component.profitChartData();

        expect(pieData.labels?.length).toBeGreaterThan(0);
        expect(profitData.labels?.length).toBeGreaterThan(0);
        expect(profitData.datasets[0].data.length).toBeGreaterThan(0);
    });
});

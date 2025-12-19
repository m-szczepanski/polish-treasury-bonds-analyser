import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvestmentStrategyComponent } from './investment-strategy';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

describe('InvestmentStrategyComponent', () => {
    let component: InvestmentStrategyComponent;
    let fixture: ComponentFixture<InvestmentStrategyComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InvestmentStrategyComponent, FormsModule, CommonModule],
        })
            .overrideComponent(InvestmentStrategyComponent, {
                set: {
                    imports: [CommonModule, FormsModule, MockBaseChartDirective]
                }
            })
            .compileComponents();

        fixture = TestBed.createComponent(InvestmentStrategyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should select bond and update state', () => {
        const config = component.configurations[0];
        component.toggleBond(config);
        expect(config.isSelected).toBe(true);
    });

    it('should calculate strategy when inputs change', async () => {
        // Select a bond
        component.toggleBond(component.configurations[0]);

        // Change duration
        component.durationMonths = 24;
        component.calculate();

        await new Promise(r => setTimeout(r, 400));

        // Verify result is updated
        expect(component.result).toBeDefined();
    });

    it('should correctly aggregate multiple selected bonds', async () => {
        component.toggleBond(component.configurations[0]); // Bond 1
        component.toggleBond(component.configurations[1]); // Bond 2

        component.calculate();

        await new Promise(r => setTimeout(r, 400));

        // Should have 2 individual charts
        expect(component.individualCharts.length).toBe(2);
        // Should have aggregate result
        expect(component.result?.totalInvested.length).toBeGreaterThan(0);
    });

    it('should update chart update flag', async () => {
        // Trigger toggle
        component.toggleBond(component.configurations[0]);

        await new Promise(r => setTimeout(r, 400));

        // Simply verify that chart data getter access doesn't crash
        expect(component.summaryChart).toBeDefined();
    });
});

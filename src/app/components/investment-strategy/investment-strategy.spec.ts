import 'zone.js/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvestmentStrategyComponent } from './investment-strategy';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Constants } from '../../logic/constants';

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
        const configs = component.configurations();
        const config = configs[0];
        component.toggleBond(config);

        const updatedConfig = component.configurations()[0];
        expect(updatedConfig.isSelected).toBe(true);
    });

    it('should calculate strategy when inputs change', async () => {
        const config = component.configurations()[0];
        component.toggleBond(config);

        component.durationMonths.set(24);

        fixture.detectChanges();

        expect(component.simulation()).toBeDefined();
    });

    it('should correctly aggregate multiple selected bonds', async () => {
        const configs = component.configurations();
        component.toggleBond(configs[0]);
        component.toggleBond(configs[1]);

        fixture.detectChanges();
        await new Promise(resolve => setTimeout(resolve, Constants.CHART_DEBOUNCE_MS + 100));

        expect(component.individualCharts().length).toBe(2);
        expect(component.simulation()?.totalInvested.length).toBeGreaterThan(0);
    });

    it('should update chart update flag', async () => {
        const config = component.configurations()[0];
        component.toggleBond(config);

        fixture.detectChanges();
        await new Promise(resolve => setTimeout(resolve, Constants.CHART_DEBOUNCE_MS + 100));

        expect(component.summaryChart()).toBeDefined();
    });
});

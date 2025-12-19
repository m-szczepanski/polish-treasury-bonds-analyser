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
        const configs = component.configurations();
        const config = configs[0];
        component.toggleBond(config);

        // Signal content mutation might not trigger new reference if using same object, 
        // but toggleBond likely updates the signal or mutates object inside.
        // Assuming toggleBond handles it.
        // Check property on the object reference we have (since it's mutable object in array)
        // OR fetch fresh from signal.
        const updatedConfig = component.configurations()[0];
        expect(updatedConfig.isSelected).toBe(true);
    });

    it('should calculate strategy when inputs change', async () => {
        // Select a bond
        const config = component.configurations()[0];
        component.toggleBond(config);

        // Change duration
        component.durationMonths.set(24);
        // component.calculate(); // Removed, reactive

        fixture.detectChanges(); // Trigger computed

        // Verify result is updated
        expect(component.simulation()).toBeDefined();
    });

    it('should correctly aggregate multiple selected bonds', async () => {
        const configs = component.configurations();
        component.toggleBond(configs[0]); // Bond 1
        component.toggleBond(configs[1]); // Bond 2

        fixture.detectChanges();

        // Should have 2 individual charts
        expect(component.individualCharts().length).toBe(2);
        // Should have aggregate result
        expect(component.simulation()?.totalInvested.length).toBeGreaterThan(0);
    });

    it('should update chart update flag', async () => {
        // Trigger toggle
        const config = component.configurations()[0];
        component.toggleBond(config);

        fixture.detectChanges();

        // Simply verify that chart data getter access doesn't crash
        expect(component.summaryChart()).toBeDefined();
    });
});

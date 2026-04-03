import 'zone.js/testing';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvestmentStrategyComponent } from './investment-strategy';
import { Constants } from '../../logic/constants';

describe('InvestmentStrategyComponent', () => {
    let component: InvestmentStrategyComponent;
    let fixture: ComponentFixture<InvestmentStrategyComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InvestmentStrategyComponent],
            providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
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
        component.toggleBond(config.bond.type);

        const updatedConfig = component.configurations()[0];
        expect(updatedConfig.isSelected).toBe(true);
    });

    it('should calculate strategy when inputs change', async () => {
        const config = component.configurations()[0];
        component.toggleBond(config.bond.type);

        component.durationMonths.set(24);

        fixture.detectChanges();

        expect(component.simulation()).toBeDefined();
    });

    it('should correctly aggregate multiple selected bonds', async () => {
        const configs = component.configurations();
        component.toggleBond(configs[0].bond.type);
        component.toggleBond(configs[1].bond.type);

        fixture.detectChanges();
        await new Promise(resolve => setTimeout(resolve, Constants.CHART_DEBOUNCE_MS + 100));

        expect(component.individualCharts().length).toBe(2);
        expect(component.simulation()?.totalInvested.length).toBeGreaterThan(0);
    });

    it('should update chart update flag', async () => {
        const config = component.configurations()[0];
        component.toggleBond(config.bond.type);

        fixture.detectChanges();
        await new Promise(resolve => setTimeout(resolve, Constants.CHART_DEBOUNCE_MS + 100));

        expect(component.summaryChart()).toBeDefined();
    });

    it('should update all top-level parameters', () => {
        component.updateParameter('freq', 2);
        component.updateParameter('dur', 36);
        component.updateParameter('infl', 5.5);

        expect(component.frequencyMonths()).toBe(2);
        expect(component.durationMonths()).toBe(36);
        expect(component.inflationRate()).toBe(5.5);
    });

    it('should update configuration numeric and boolean values', () => {
        const bondType = component.configurations()[0].bond.type;

        component.updateConfigValue(bondType, 'initialAmount', '12345' as unknown as number);
        component.updateConfigValue(bondType, 'reinvest', false);

        const updated = component.configurations()[0];
        expect(updated.initialAmount).toBe(12345);
        expect(updated.reinvest).toBe(false);
    });

    it('should return null simulation for invalid parameters', () => {
        const bondType = component.configurations()[0].bond.type;
        component.toggleBond(bondType);
        component.updateParameter('freq', 0);

        expect(component.simulation()).toBeNull();
    });

    it('should expose zero summary values when no simulation exists', () => {
        expect(component.totalProfit).toBe(0);
        expect(component.netProfit).toBe(0);
        expect(component.totalInvestedSum).toBe(0);
        expect(component.totalValueSum).toBe(0);
    });

    it('should not create individual charts when only one bond is selected', async () => {
        const bondType = component.configurations()[0].bond.type;
        component.toggleBond(bondType);

        fixture.detectChanges();
        await new Promise(resolve => setTimeout(resolve, Constants.CHART_DEBOUNCE_MS + 100));

        expect(component.individualCharts().length).toBe(0);
    });

    it('should toggle bond selection via template click', () => {
        const header = fixture.nativeElement.querySelector('.config-header') as HTMLElement;

        header.click();
        fixture.detectChanges();

        expect(component.configurations()[0].isSelected).toBe(true);
    });

    it('should update duration via range input event', () => {
        const durationInput = fixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;

        durationInput.value = '48';
        durationInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.durationMonths()).toBe(48);
    });

    it('should update inflation via number input blur flow', () => {
        const inflationInput = fixture.nativeElement.querySelectorAll('input[type="number"]')[1] as HTMLInputElement;

        inflationInput.value = '6.2';
        inflationInput.dispatchEvent(new Event('input'));
        inflationInput.dispatchEvent(new Event('blur'));
        fixture.detectChanges();

        expect(component.inflationRate()).toBe(6.2);
    });

});

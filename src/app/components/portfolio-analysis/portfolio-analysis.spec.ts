import 'zone.js/testing';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioAnalysisComponent } from './portfolio-analysis';
import { RouterTestingModule } from '@angular/router/testing';
import { BondType, Constants } from '../../logic/constants';

describe('PortfolioAnalysisComponent', () => {
    let component: PortfolioAnalysisComponent;
    let fixture: ComponentFixture<PortfolioAnalysisComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PortfolioAnalysisComponent, RouterTestingModule],
            providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
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
        await new Promise(resolve => setTimeout(resolve, Constants.CHART_DEBOUNCE_MS + 100));
        const pieData = component.pieChartData();
        const profitData = component.profitChartData();

        expect(pieData.labels?.length).toBeGreaterThan(0);
        expect(profitData.labels?.length).toBeGreaterThan(0);
        expect(profitData.datasets[0].data.length).toBeGreaterThan(0);
    });

    it('should not remove last remaining bond row', () => {
        component.removeBond(0);

        expect(component.portfolio().length).toBe(1);
    });

    it('should provide short horizon optimization tip for non-OTS bonds', () => {
        component.investmentHorizon.set(2);
        component.updateBondType(0, BondType.EDO);

        expect(component.optimizationTip()).toContain('obligacje OTS są zazwyczaj najlepsze');
    });

    it('should provide short horizon positive tip for OTS-only portfolio', () => {
        component.investmentHorizon.set(2);
        component.updateBondType(0, BondType.OTS);

        expect(component.optimizationTip()).toContain('portfel wygląda optymalnie');
    });

    it('should provide medium horizon tip when OTS exists', () => {
        component.investmentHorizon.set(24);
        component.updateBondType(0, BondType.OTS);

        expect(component.optimizationTip()).toContain('mogą przynieść wyższy zysk');
    });

    it('should provide medium horizon diversification tip without OTS', () => {
        component.investmentHorizon.set(24);
        component.updateBondType(0, BondType.COI);

        expect(component.optimizationTip()).toContain('dywersyfikację');
    });

    it('should provide long horizon tip', () => {
        component.investmentHorizon.set(48);

        expect(component.optimizationTip()).toContain('obligacje EDO');
    });

    it('should calculate summary for early redemption horizon', () => {
        component.updateBondType(0, BondType.EDO);
        component.investmentHorizon.set(6);
        fixture.detectChanges();

        const summary = component.summary();
        expect(summary.totalInvestment).toBe(1000);
        expect(summary.tax).toBeGreaterThanOrEqual(0);
    });

    it('should add and remove rows via template buttons', () => {
        const addButton = fixture.nativeElement.querySelector('.add-btn') as HTMLButtonElement;
        addButton.click();
        fixture.detectChanges();

        expect(component.portfolio().length).toBe(2);

        const removeButtons = fixture.nativeElement.querySelectorAll('.remove-btn');
        (removeButtons[1] as HTMLButtonElement).click();
        fixture.detectChanges();

        expect(component.portfolio().length).toBe(1);
    });

    it('should update bond type and amount via template form controls', () => {
        const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
        select.value = BondType.COI;
        select.dispatchEvent(new Event('change'));

        const amountInput = fixture.nativeElement.querySelector('input[type="number"]') as HTMLInputElement;
        amountInput.value = '2300';
        amountInput.dispatchEvent(new Event('input'));
        amountInput.dispatchEvent(new Event('blur'));
        fixture.detectChanges();

        expect(component.portfolio()[0].bondType).toBe(BondType.COI);
        expect(component.portfolio()[0].amount).toBe(2300);
    });

    it('should update horizon via slider input', () => {
        const slider = fixture.nativeElement.querySelector('.horizon-slider') as HTMLInputElement;
        slider.value = '30';
        slider.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.investmentHorizon()).toBe(30);
    });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvestmentStrategyComponent } from './investment-strategy';

describe('InvestmentStrategyComponent', () => {
    let component: InvestmentStrategyComponent;
    let fixture: ComponentFixture<InvestmentStrategyComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InvestmentStrategyComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(InvestmentStrategyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display strategy container', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const container = compiled.querySelector('.strategy-container');
        expect(container).toBeTruthy();
    });

    it('should display header with title and description', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const header = compiled.querySelector('.header');
        expect(header?.querySelector('h1')?.textContent).toBe('Strategia Inwestycyjna');
        expect(header?.querySelector('p')?.textContent).toBe('Zaawansowana symulacja portfela obligacji');
    });

    it('should initialize with default configurations', () => {
        expect(component.configurations.length).toBeGreaterThan(0);
        const active = component.configurations.filter(c => c.isSelected);
        expect(active.length).toBe(0);
    });

    it('should select bond and trigger calculation', () => {
        const firstConfig = component.configurations[0];

        component.toggleBond(firstConfig);
        expect(firstConfig.isSelected).toBe(true);
        expect(component.result).not.toBeNull();
        expect(component.summaryChart).not.toBeNull();
    });

    it('should update chart when inputs change', () => {
        component.toggleBond(component.configurations[0]);
        fixture.detectChanges();

        const initialVal = component.result?.totalValue[component.result.totalValue.length - 1];

        component.durationMonths = 24;
        component.calculate();

        const newVal = component.result?.totalValue[component.result.totalValue.length - 1];
        expect(newVal).not.toBe(initialVal);
    });

    it('should aggregate multiple bonds correctly', () => {
        component.toggleBond(component.configurations[0]); // Bond A
        component.toggleBond(component.configurations[1]); // Bond B

        expect(component.individualCharts.length).toBe(2);
        expect(component.summaryChart).not.toBeNull();

        const investA = component.configurations[0].initialAmount;
        const investB = component.configurations[1].initialAmount;

        expect(component.result?.totalInvested[0]).toBe(investA + investB);
    });
});

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

    it('should select bond and trigger calculation', async () => {
        const firstConfig = component.configurations[0];

        component.toggleBond(firstConfig);
        expect(firstConfig.isSelected).toBe(true);

        await new Promise(resolve => setTimeout(resolve, 400));
        expect(component.result).not.toBeNull();
        expect(component.summaryChart).not.toBeNull();
    });

    it('should update chart when inputs change', async () => {
        component.toggleBond(component.configurations[0]);
        await new Promise(resolve => setTimeout(resolve, 400));
        fixture.detectChanges();

        const initialVal = component.result?.totalValue[component.result.totalValue.length - 1];

        component.durationMonths = 24;
        component.calculate();
        await new Promise(resolve => setTimeout(resolve, 400));

        const newVal = component.result?.totalValue[component.result.totalValue.length - 1];
        expect(newVal).not.toBe(initialVal);
    });

    it('should aggregate multiple bonds correctly', async () => {
        component.toggleBond(component.configurations[0]); // Bond A
        await new Promise(resolve => setTimeout(resolve, 400)); // Wait for debounce
        component.toggleBond(component.configurations[1]); // Bond B
        await new Promise(resolve => setTimeout(resolve, 400)); // Wait for debounce

        expect(component.individualCharts.length).toBe(2);
        expect(component.summaryChart).not.toBeNull();

        const investA = component.configurations[0].initialAmount + component.configurations[0].recurringAmount;
        const investB = component.configurations[1].initialAmount + component.configurations[1].recurringAmount;

        expect(component.result?.totalInvested[0]).toBe(investA + investB);
    });

    describe('Getter Properties', () => {
        it('should return 0 for totalProfit when result is null', () => {
            component.result = null;
            expect(component.totalProfit).toBe(0);
        });

        it('should return totalProfit from result when available', async () => {
            component.toggleBond(component.configurations[0]);
            await new Promise(resolve => setTimeout(resolve, 400));
            expect(component.totalProfit).toBe(component.result!.totalProfit);
        });

        it('should return 0 for netProfit when result is null', () => {
            component.result = null;
            expect(component.netProfit).toBe(0);
        });

        it('should return netProfit from result when available', async () => {
            component.toggleBond(component.configurations[0]);
            await new Promise(resolve => setTimeout(resolve, 400));
            expect(component.netProfit).toBe(component.result!.netProfit);
        });

        it('should return 0 for totalInvestedSum when result is null or empty', () => {
            component.result = null;
            expect(component.totalInvestedSum).toBe(0);
        });

        it('should return last totalInvested value when result is available', async () => {
            component.toggleBond(component.configurations[0]);
            await new Promise(resolve => setTimeout(resolve, 400));
            const expected = component.result!.totalInvested[component.result!.totalInvested.length - 1];
            expect(component.totalInvestedSum).toBe(expected);
        });

        it('should return 0 for totalValueSum when result is null or empty', () => {
            component.result = null;
            expect(component.totalValueSum).toBe(0);
        });

        it('should return last totalValue when result is available', async () => {
            component.toggleBond(component.configurations[0]);
            await new Promise(resolve => setTimeout(resolve, 400));
            const expected = component.result!.totalValue[component.result!.totalValue.length - 1];
            expect(component.totalValueSum).toBe(expected);
        });
    });

    describe('Input Validation', () => {
        it('should not calculate with invalid frequencyMonths', async () => {
            component.toggleBond(component.configurations[0]);
            const initialResult = component.result;

            component.frequencyMonths = 0;
            component.calculate();

            await new Promise(resolve => setTimeout(resolve, 400));
            expect(component.result).toBe(initialResult);
        });

        it('should not calculate with invalid durationMonths', async () => {
            component.toggleBond(component.configurations[0]);
            const initialResult = component.result;

            component.durationMonths = -1;
            component.calculate();

            await new Promise(resolve => setTimeout(resolve, 400));
            expect(component.result).toBe(initialResult);
        });

        it('should not calculate with negative inflationRate', async () => {
            component.toggleBond(component.configurations[0]);
            const initialResult = component.result;

            component.inflationRate = -1;
            component.calculate();

            await new Promise(resolve => setTimeout(resolve, 400));
            expect(component.result).toBe(initialResult);
        });
    });
});

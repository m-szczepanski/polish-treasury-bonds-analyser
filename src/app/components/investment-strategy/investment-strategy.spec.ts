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
});

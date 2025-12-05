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

    it('should display placeholder content', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const placeholderDiv = compiled.querySelector('.content-placeholder');
        expect(placeholderDiv).toBeTruthy();
        expect(placeholderDiv?.textContent).toContain('Tu będzie analiza strategii inwestycyjnej.');
        expect(placeholderDiv?.textContent).toContain('Placeholder...');
    });

    it('should display header with title and description', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const header = compiled.querySelector('.header');
        expect(header?.querySelector('h1')?.textContent).toBe('Strategia Inwestycyjna');
        expect(header?.querySelector('p')?.textContent).toBe('Symulacja wpłat jednorazowych i cyklicznych');
    });
});

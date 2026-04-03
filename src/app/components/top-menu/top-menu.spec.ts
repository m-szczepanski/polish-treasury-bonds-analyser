import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopMenuComponent } from './top-menu';
import { provideRouter } from '@angular/router';

describe('TopMenuComponent', () => {
    let component: TopMenuComponent;
    let fixture: ComponentFixture<TopMenuComponent>;

    const getAnchorByText = (text: string): HTMLAnchorElement | undefined => {
        const compiled = fixture.nativeElement as HTMLElement;
        const links = Array.from(compiled.querySelectorAll('a')) as HTMLAnchorElement[];
        return links.find(link => link.textContent?.includes(text));
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TopMenuComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(TopMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have menu item for Kalkulator (home)', () => {
        const link = getAnchorByText('Kalkulator');
        expect(link).toBeTruthy();
        expect(link?.textContent).toContain('Kalkulator');
    });

    it('should have menu item for Strategy', () => {
        const link = getAnchorByText('Strategia Inwestycyjna');
        expect(link).toBeTruthy();
        expect(link?.textContent).toContain('Strategia Inwestycyjna');
    });

    it('should have menu item for Portfolio Analysis', () => {
        const link = getAnchorByText('Analiza portfela');
        expect(link).toBeTruthy();
        expect(link?.textContent).toContain('Analiza portfela');
    });

    it('should have external link to obligacjeskarbowe.pl', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const link = compiled.querySelector('a.external') as HTMLAnchorElement;
        expect(link).toBeTruthy();
        expect(link.href).toBe('https://www.obligacjeskarbowe.pl/');
        expect(link.target).toBe('_blank');
    });
});

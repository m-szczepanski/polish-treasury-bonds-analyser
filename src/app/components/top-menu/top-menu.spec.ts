import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopMenuComponent } from './top-menu';
import { provideRouter } from '@angular/router';

describe('TopMenuComponent', () => {
    let component: TopMenuComponent;
    let fixture: ComponentFixture<TopMenuComponent>;

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
        const compiled = fixture.nativeElement as HTMLElement;
        const link = compiled.querySelector('a[routerLink="/"]');
        expect(link).toBeTruthy();
        expect(link?.textContent).toContain('Kalkulator');
    });

    it('should have menu item for Strategy', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const link = compiled.querySelector('a[routerLink="/strategy"]');
        expect(link).toBeTruthy();
        expect(link?.textContent).toContain('Strategia Inwestycyjna');
    });

    it('should have menu item for Portfolio Analysis', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const link = compiled.querySelector('a[routerLink="/analysis"]');
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

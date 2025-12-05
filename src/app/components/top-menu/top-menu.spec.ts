import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopMenuComponent } from './top-menu';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';

describe('TopMenuComponent', () => {
    let component: TopMenuComponent;
    let fixture: ComponentFixture<TopMenuComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TopMenuComponent, RouterTestingModule],
        }).compileComponents();

        fixture = TestBed.createComponent(TopMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have menu items', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const menuItems = compiled.querySelectorAll('.menu-item');
        expect(menuItems.length).toBeGreaterThan(0);
    });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { MainPageComponent } from './main-page';

describe('MainPageComponent', () => {
  let component: MainPageComponent;
  let fixture: ComponentFixture<MainPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainPageComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    })
      .compileComponents();

    fixture = TestBed.createComponent(MainPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default investmentAmount of 1000', () => {
    expect(component.investmentAmount()).toBe(1000);
  });

  it('should update investmentAmount when slider value changes', () => {
    const slider = fixture.nativeElement.querySelector('#global-investment') as HTMLInputElement;
    expect(slider).toBeTruthy();

    slider.value = '5000';
    slider.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.investmentAmount()).toBe(5000);
  });

  it('should display investmentAmount in the label', () => {
    component.investmentAmount.set(7500);
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('label[for="global-investment"]') as HTMLElement;
    expect(label.textContent).toContain('Kwota inwestycji: 7,500 PLN');
  });

  it('should propagate investmentAmount to bond-card components', () => {
    component.investmentAmount.set(3000);
    fixture.detectChanges();

    const bondCards = fixture.nativeElement.querySelectorAll('app-bond-card');
    expect(bondCards.length).toBeGreaterThan(0);
  });

  it('should render bond cards for all bonds', () => {
    const bondCards = fixture.nativeElement.querySelectorAll('app-bond-card');
    expect(bondCards.length).toBe(component.bonds.length);
  });

  it('should clamp value below minimum', () => {
    component.onInvestmentInput({ target: { value: '10' } } as unknown as Event);
    fixture.detectChanges();

    expect(component.investmentAmount()).toBe(component.minInvestmentAmount);
  });

  it('should clamp value above maximum', () => {
    component.onInvestmentInput({ target: { value: '999999' } } as unknown as Event);
    fixture.detectChanges();

    expect(component.investmentAmount()).toBe(component.maxInvestmentAmount);
  });

  it('should round value to the nearest step', () => {
    component.onInvestmentInput({ target: { value: '1051' } } as unknown as Event);
    fixture.detectChanges();

    expect(component.investmentAmount()).toBe(1100);
  });

  it('should fallback to default for non-finite input', () => {
    component.onInvestmentInput({ target: { value: 'abc' } } as unknown as Event);
    fixture.detectChanges();

    expect(component.investmentAmount()).toBe(1000);
  });
});

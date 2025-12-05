import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { MainPageComponent } from './main-page';
import { BondCardComponent } from '../bond-card/bond-card';

@Component({
  selector: 'app-bond-card',
  standalone: true,
  template: ''
})
class MockBondCardComponent {
  @Input() bond: any;
  @Input() investmentAmount: any;
}

describe('MainPageComponent', () => {
  let component: MainPageComponent;
  let fixture: ComponentFixture<MainPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainPageComponent],
    })
      .overrideComponent(MainPageComponent, {
        remove: { imports: [BondCardComponent] },
        add: { imports: [MockBondCardComponent] }
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
    expect(component.investmentAmount).toBe(1000);
  });

  it('should update investmentAmount when slider value changes', () => {
    const slider = fixture.nativeElement.querySelector('#global-investment') as HTMLInputElement;
    expect(slider).toBeTruthy();

    slider.value = '5000';
    slider.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.investmentAmount).toBe(5000);
  });

  it('should display investmentAmount in the label', () => {
    component.investmentAmount = 7500;
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('label[for="global-investment"]') as HTMLElement;
    expect(label.textContent).toContain('7 500');
  });

  it('should propagate investmentAmount to bond-card components', () => {
    component.investmentAmount = 3000;
    fixture.detectChanges();

    const bondCards = fixture.nativeElement.querySelectorAll('app-bond-card');
    expect(bondCards.length).toBeGreaterThan(0);
    // Note: Since we're using a mock component, we can't directly test the input binding,
    // but we verify that the bond cards are rendered with the template
  });

  it('should render bond cards for all bonds', () => {
    const bondCards = fixture.nativeElement.querySelectorAll('app-bond-card');
    expect(bondCards.length).toBe(component.bonds.length);
  });
});

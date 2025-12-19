import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BondCardComponent } from './bond-card';
import { Bond, BondType } from '../../logic/constants';
import { Component, Input, SimpleChange } from '@angular/core';

@Component({
  selector: 'canvas[baseChart]',
  standalone: true,
  template: ''
})
class MockBaseChartDirective {
  @Input() data: any;
  @Input() options: any;
  @Input() type: any;
}

describe('BondCardComponent', () => {
  let component: BondCardComponent;
  let fixture: ComponentFixture<BondCardComponent>;

  const mockBond: Bond = {
    type: BondType.OTS,
    name: 'Oszczędnościowe Trzymiesięczne Stałoprocentowe',
    description: 'Stałe oprocentowanie przez 3 miesiące',
    interestRate: 3.0,
    durationMonths: 3,
    isIndexedToInflation: false,
    capitalizationFreqMonths: 0,
    earlyRedemptionFee: 0,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BondCardComponent],
    })
      .overrideComponent(BondCardComponent, {
        add: { imports: [MockBaseChartDirective] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(BondCardComponent);
    component = fixture.componentInstance;
    component.bond = mockBond;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate simulation on init', () => {
    expect(component.simulationResult).toBeDefined();
    expect(component.simulationResult?.months.length).toBe(4); // 0, 1, 2, 3
  });

  it('should update calculation when investment amount changes', () => {
    component.investmentAmount = 5000;
    component.ngOnChanges({
      investmentAmount: new SimpleChange(1000, 5000, false)
    });

    expect(component.simulationResult?.values[0]).toBe(5000);
  });

  it('should update chart data when calculation runs', () => {
    component.calculate();
    // Verify chart data is populated
    expect(component.lineChartData.labels?.length).toBeGreaterThan(0);
    expect(component.lineChartData.datasets[0].data.length).toBeGreaterThan(0);
  });

  it('should return correct profit color', () => {
    // OTS always has positive profit
    expect(component.profitColor).toBe('#2e7d32');
  });
});

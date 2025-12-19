import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BondCardComponent } from './bond-card';
import { Bond, BondType } from '../../logic/constants';
import { BondCalculatorService } from '../../logic/bond-calculator';
import { ChartConfigService } from '../../logic/chart-config.service';
import { BaseChartDirective } from 'ng2-charts';
import { Directive, Input } from '@angular/core';

@Directive({
  selector: 'canvas[baseChart]',
  standalone: true
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
      providers: [
        BondCalculatorService,
        ChartConfigService,
      ]
    })
      // Override template to avoid chart rendering issues in test environment
      .overrideTemplate(BondCardComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(BondCardComponent);
    component = fixture.componentInstance;

    // Set signals using fixture ref
    fixture.componentRef.setInput('bond', mockBond);
    fixture.componentRef.setInput('investmentAmount', 1000);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate simulation on init', () => {
    // Access computed signal
    expect(component.simulationResult()).toBeDefined();
    expect(component.simulationResult()?.months.length).toBe(4); // 0, 1, 2, 3
  });

  it('should update calculation when investment amount changes', () => {
    fixture.componentRef.setInput('investmentAmount', 5000);
    fixture.detectChanges();

    expect(component.simulationResult()?.values[0]).toBe(5000);
  });

  it('should update chart data when calculation runs', () => {
    // With signals, effect runs on change.
    fixture.componentRef.setInput('investmentAmount', 2000);
    fixture.detectChanges();

    // Check chart data property (it's a plain object property updated by effect)
    expect(component.lineChartData.labels?.length).toBeGreaterThan(0);
    expect(component.lineChartData.datasets[0].data.length).toBeGreaterThan(0);
  });

  it('should return correct profit color', () => {
    expect(component.profitColor).toBe('#2e7d32');
  });
});

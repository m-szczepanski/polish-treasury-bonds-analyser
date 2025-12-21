import 'zone.js/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BondCardComponent } from './bond-card';
import { Bond, BondType } from '../../logic/constants';
import { BondCalculatorService } from '../../logic/bond-calculator';
import { ChartConfigService } from '../../logic/chart-config.service';

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
      .overrideTemplate(BondCardComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(BondCardComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('bond', mockBond);
    fixture.componentRef.setInput('investmentAmount', 1000);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate simulation on init', () => {
    expect(component.simulationResult()).toBeDefined();
    expect(component.simulationResult()?.months.length).toBe(4);
  });

  it('should update calculation when investment amount changes', () => {
    fixture.componentRef.setInput('investmentAmount', 5000);
    fixture.detectChanges();

    expect(component.simulationResult()?.values[0]).toBe(5000);
  });

  it('should update chart data when calculation runs', async () => {
    fixture.componentRef.setInput('investmentAmount', 2000);
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 600));

    expect(component.lineChartData().labels?.length).toBeGreaterThan(0);
    expect(component.lineChartData().datasets[0].data.length).toBeGreaterThan(0);
  });

  it('should return correct profit color', () => {
    expect(component.profitColor).toBe('#2e7d32');
  });

});

import 'zone.js/testing';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BondCardComponent } from './bond-card';
import { Bond, BondType, Constants } from '../../logic/constants';
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
        { provide: PLATFORM_ID, useValue: 'server' },
      ]
    })
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
    await new Promise(resolve => setTimeout(resolve, Constants.CHART_DEBOUNCE_MS + 100));

    expect(component.lineChartData().labels?.length).toBeGreaterThan(0);
    expect(component.lineChartData().datasets[0].data.length).toBeGreaterThan(0);
  });

  it('should return correct profit color', () => {
    expect(component.resultSummary().profitColor).toBe('#2e7d32');
  });

  it('should return negative color when net profit is non-positive', () => {
    fixture.componentRef.setInput('investmentAmount', 0);
    fixture.detectChanges();

    expect(component.resultSummary().profitColor).toBe('#d32f2f');
  });

  it('should render summary labels in template', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Zysk Brutto:');
    expect(compiled.textContent).toContain('Podatek Belki:');
    expect(compiled.textContent).toContain('Zysk Netto:');
  });

});

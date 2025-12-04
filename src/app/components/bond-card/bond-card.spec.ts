import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BondCardComponent } from './bond-card';
import { Bond, BondType } from '../../logic/constants';

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
    }).compileComponents();

    fixture = TestBed.createComponent(BondCardComponent);
    component = fixture.componentInstance;
    component.bond = mockBond;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

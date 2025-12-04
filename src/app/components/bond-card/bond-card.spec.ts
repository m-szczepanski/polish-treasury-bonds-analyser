import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BondCard } from './bond-card';

describe('BondCard', () => {
  let component: BondCard;
  let fixture: ComponentFixture<BondCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BondCard],
    }).compileComponents();

    fixture = TestBed.createComponent(BondCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

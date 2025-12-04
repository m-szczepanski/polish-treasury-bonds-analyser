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
});

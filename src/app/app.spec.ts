import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AppComponent } from './app';
import { TopMenuComponent } from './components/top-menu/top-menu';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-top-menu',
  standalone: true,
  template: ''
})
class MockTopMenuComponent { }

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    })
      .overrideComponent(AppComponent, {
        remove: { imports: [TopMenuComponent, RouterOutlet] },
        add: { imports: [MockTopMenuComponent, RouterOutlet] }
      })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});

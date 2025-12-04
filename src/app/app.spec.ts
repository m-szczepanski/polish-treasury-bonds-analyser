import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AppComponent } from './app';
import { MainPageComponent } from './components/main-page/main-page';
import { SidePanelComponent } from './components/side-panel/side-panel';

@Component({
  selector: 'app-main-page',
  standalone: true,
  template: ''
})
class MockMainPageComponent { }

@Component({
  selector: 'app-side-panel',
  standalone: true,
  template: ''
})
class MockSidePanelComponent { }

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    })
      .overrideComponent(AppComponent, {
        remove: { imports: [MainPageComponent, SidePanelComponent] },
        add: { imports: [MockMainPageComponent, MockSidePanelComponent] }
      })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });


});

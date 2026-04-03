import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { vi } from 'vitest';
import { AppComponent } from './app';
import { Router, provideRouter } from '@angular/router';
import { SeoService } from './services/seo.service';

@Component({
  standalone: true,
  template: ''
})
class DummyRouteComponent { }

describe('AppComponent', () => {
  const seoSpy = {
    setPageData: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([
          {
            path: '',
            component: DummyRouteComponent,
            data: {
              title: 'Start',
              description: 'Opis startowy',
              keywords: 'k1, k2',
            },
          },
          {
            path: 'no-data',
            component: DummyRouteComponent,
          },
        ]),
        { provide: SeoService, useValue: seoSpy },
      ],
    })
      .compileComponents();
  });

  afterEach(() => {
    seoSpy.setPageData.mockReset();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should call SEO service with route metadata', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');

    expect(seoSpy.setPageData).toHaveBeenCalledWith('Start', 'Opis startowy', 'k1, k2');
  });

  it('should call SEO service with fallback values when route data is missing', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/no-data');

    expect(seoSpy.setPageData).toHaveBeenCalledWith(
      'Kalkulator Obligacji',
      'Analizuj zyski z polskich obligacji skarbowych.',
      undefined
    );
  });
});

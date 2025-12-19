import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { TopMenuComponent } from './components/top-menu/top-menu';
import { SeoService } from './services/seo.service';
import { filter, map, mergeMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TopMenuComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private seoService = inject(SeoService);
  private destroyRef = inject(DestroyRef);
  title = 'polish-treasury-bonds-analyser';

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => {
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        mergeMap((route) => route.data),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        const title = data['title'] || 'Kalkulator Obligacji';
        const description =
          data['description'] || 'Analizuj zyski z polskich obligacji skarbowych.';
        this.seoService.setPageData(title, description);
      });
  }
}

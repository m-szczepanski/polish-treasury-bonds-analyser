import { Routes } from '@angular/router';
import { MainPageComponent } from './components/main-page/main-page';
import { InvestmentStrategyComponent } from './components/investment-strategy/investment-strategy';

export const routes: Routes = [
    {
        path: '',
        component: MainPageComponent,
        data: {
            title: 'Kalkulator Zysków',
            description: 'Oblicz zysk z polskich obligacji skarbowych (OTS, DOS, TOZ, COI, EDO). Sprawdź opłacalność inwestycji.',
        },
    },
    {
        path: 'strategy',
        component: InvestmentStrategyComponent,
        data: {
            title: 'Strategia Inwestycyjna',
            description: 'Symulacja długoterminowych strategii inwestowania w obligacje skarbowe (drabina obligacji).',
        },
    },
    {
        path: 'analysis',
        loadComponent: () =>
            import('./components/portfolio-analysis/portfolio-analysis').then(
                (m) => m.PortfolioAnalysisComponent,
            ),
        data: {
            title: 'Analiza Portfela',
            description: 'Szczegółowa analiza Twojego portfela obligacji skarbowych. Wgraj plik z historią operacji.',
        },
    },
    { path: '**', redirectTo: '' },
];

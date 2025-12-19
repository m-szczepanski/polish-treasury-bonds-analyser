import { Routes } from '@angular/router';
import { MainPageComponent } from './components/main-page/main-page';
import { InvestmentStrategyComponent } from './components/investment-strategy/investment-strategy';

export const routes: Routes = [
    { path: '', component: MainPageComponent },
    { path: 'strategy', component: InvestmentStrategyComponent },
    { path: 'analysis', loadComponent: () => import('./components/portfolio-analysis/portfolio-analysis').then(m => m.PortfolioAnalysisComponent) },
    { path: '**', redirectTo: '' },
];

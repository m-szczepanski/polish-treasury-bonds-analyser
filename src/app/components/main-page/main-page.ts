import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BondCardComponent } from '../bond-card/bond-card';
import { Constants } from '../../logic/constants';
import { UI_DEFAULTS } from '../../logic/ui-defaults';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, BondCardComponent],
  templateUrl: './main-page.html',
  styleUrl: './main-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent {
  private readonly defaultInvestmentAmount: number = UI_DEFAULTS.DEFAULT_INVESTMENT_AMOUNT;

  readonly minInvestmentAmount = UI_DEFAULTS.MIN_INVESTMENT_AMOUNT;
  readonly maxInvestmentAmount = UI_DEFAULTS.MAX_INVESTMENT_AMOUNT;
  readonly investmentStep = UI_DEFAULTS.INVESTMENT_STEP;

  readonly bonds = Constants.BONDS;
  readonly investmentAmount = signal<number>(this.defaultInvestmentAmount);

  onInvestmentInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const value = Number(input?.value);
    this.investmentAmount.set(this.normalizeAmount(value));
  }

  private normalizeAmount(value: number): number {
    if (!Number.isFinite(value)) {
      return this.defaultInvestmentAmount;
    }

    const clamped = Math.min(this.maxInvestmentAmount, Math.max(this.minInvestmentAmount, value));
    return Math.round(clamped / this.investmentStep) * this.investmentStep;
  }
}

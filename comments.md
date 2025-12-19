src/app/components/bond-card/bond-card.ts
Comment on lines +54 to +58
    const dataset = this.chartConfig.getDataset(
      'Wartość inwestycji (PLN)',
      result.values,
      true
    ) as unknown as ChartDataset<'line', number[]>;
Copilot AI
1 minute ago
Type casting with 'as unknown as ChartDataset' is a code smell indicating a type mismatch. The getDataset method returns ChartConfiguration['data']['datasets'][0] but needs to be cast to ChartDataset<'line', number[]>. Consider either: (1) making getDataset a generic method that accepts the chart type, or (2) changing the return type to be compatible with all chart types without casting. The investment-strategy component avoids this issue by using ChartConfiguration['data'] (line 20 in investment-strategy.ts) which is more flexible.

---

src/app/components/portfolio-analysis/portfolio-analysis.ts
Comment on lines +154 to +159
        const profitDataset = this.chartConfig.getDataset(
            'Wartość Portfela (PLN)',
            timelineValues,
            true, // Primary color
            true  // Fill
        ) as unknown as ChartDataset<'line', number[]>;
Copilot AI
1 minute ago
Type casting with 'as unknown as ChartDataset' is a code smell indicating a type mismatch. The getDataset method returns ChartConfiguration['data']['datasets'][0] but needs to be cast to ChartDataset<'line', number[]>. Consider either: (1) making getDataset a generic method that accepts the chart type, or (2) changing the return type to be compatible with all chart types without casting. The investment-strategy component avoids this issue by using ChartConfiguration['data'] (line 20 in investment-strategy.ts) which is more flexible.

Suggested change
from:
        const profitDataset = this.chartConfig.getDataset(
            'Wartość Portfela (PLN)',
            timelineValues,
            true, // Primary color
            true  // Fill
        ) as unknown as ChartDataset<'line', number[]>;
to:        
        const genericDataset = this.chartConfig.getDataset(
            'Wartość Portfela (PLN)',
            timelineValues,
            true, // Primary color
            true  // Fill
        ) as any;
        const profitDataset = genericDataset as ChartDataset<'line', number[]>;

---

src/app/components/bond-card/bond-card.spec.ts
Comment on lines 58 to 64
Copilot AI
3 minutes ago
Test coverage removed for the profitColor getter. While the profitColor getter still exists in the component (line 66-68), the test that verified it was deleted. Consider adding back a test to ensure the getter returns the correct color based on profit values.

---

src/app/components/investment-strategy/investment-strategy.ts

Copilot AI
4 minutes ago
The 'result' parameter is typed as 'any', which defeats TypeScript's type safety. Based on the performCalculation method, this should be typed with an interface that includes months, totalValue, totalInvested, totalProfit, netProfit, and simulations properties. Consider creating a proper type for this or reusing existing types.

Suggested change
from:    private createSummaryChart(result: any): ChartSet {
to:    private createSummaryChart(result: StrategyResult): ChartSet {

---

src/app/components/investment-strategy/investment-strategy.ts
Comment on lines +117 to 126
                result: this.strategyCalculator.simulate({
                    bond: config.bond,
                    initialAmount: config.initialAmount,
                    recurringAmount: config.recurringAmount,
                    frequencyMonths: this.frequencyMonths,
                    durationMonths: this.durationMonths,
                    inflationRate: this.inflationRate,
                    frequencyMonths: frequencyMonths,
                    durationMonths: durationMonths,
                    inflationRate: inflationRate,
                    reinvest: config.reinvest
                })
            };
Copilot AI
5 minutes ago
Missing error handling for strategyCalculator.simulate() calls. The service method throws errors for invalid inputs (lines 34, 37, 40 in strategy-calculator.ts), but these exceptions are not caught here. While performCalculation does validate inputs before calling simulate(), the validation logic is duplicated and could get out of sync. Consider either wrapping the simulate() calls in try-catch blocks or removing the early validation in performCalculation to rely on the service's error handling.

---

src/app/components/investment-strategy/investment-strategy.ts
Comment on lines +78 to 82
    updateKwargs(key: 'freq' | 'dur' | 'infl', value: number) {
        if (key === 'freq') this.frequencyMonths.set(value);
        if (key === 'dur') this.durationMonths.set(value);
        if (key === 'infl') this.inflationRate.set(value);
    }
Copilot AI
5 minutes ago
The method name 'updateKwargs' uses Python terminology ('kwargs' = keyword arguments) which is not idiomatic in TypeScript/Angular. Consider renaming to something more descriptive and TypeScript-appropriate like 'updateParameter', 'updateField', or 'updateSimulationParameter'.

---

src/app/logic/strategy-calculator.ts
    constructor(private bondCalculator: BondCalculatorService) { }

    /**
     * Simulates an investment strategy over a specified duration, handling tranches, reinvestment, tax calculations, and early redemption.
Copilot AI
6 minutes ago
Significant documentation removed from the simulate method. The detailed JSDoc comment explaining the algorithm, parameters, and return values was deleted, leaving only a brief description. This documentation provided valuable context for understanding how the strategy simulation works (tranches, reinvestment, tax calculations, etc.). Consider restoring key portions of this documentation to maintain code understandability, especially for complex logic like tranche tracking and tax calculations.

Suggested change
from:     
    * Simulates an investment strategy over a specified duration, handling tranches, reinvestment, tax calculations, and early redemption.
to:     
    * Simulates an investment strategy over the requested duration.
    * The strategy is modeled as a series of investment “tranches”. Each tranche
    * represents a single contribution (initial or recurring) that is invested
    * into the given bond and then simulated independently using
    * {@link BondCalculatorService}. Tranches are created as follows:
    *
    * - At month 0, the `initialAmount` (if > 0) is invested as the first tranche.
    * - For each subsequent month up to `durationMonths`, a new tranche is
    *   created whenever the month is a multiple of `frequencyMonths` and
     *   `recurringAmount` > 0.
     * - If `reinvest` is enabled, coupon payments and/or matured proceeds from
     *   existing tranches may be treated as new contributions, effectively
     *   creating additional reinvestment tranches over time.
     *
     * The per‑tranche bond simulations incorporate any bond‑specific behavior
     * such as interest accrual, tax treatment, indexation, and early redemption
     * rules via the underlying {@link BondCalculatorService}. This method
     * aggregates the individual tranche simulations month by month to produce:
     *
     * - The timeline of simulated months.
     * - The cumulative amount invested by those months (nominal contributions,
     *   before profit/tax).
     * - The total portfolio value, including principal and any reinvested
     *   returns.
     * - The gross profit (total value minus total invested).
     * - The net profit after any taxes or early‑redemption effects included in
     *   the tranche simulations.
     *
     * Input validation ensures:
     * - `durationMonths` is non‑negative.
     * - If `recurringAmount` > 0, then `frequencyMonths` must be positive.
     * - `initialAmount` and `recurringAmount` must be non‑negative.
     *
     * @param request Configuration of the investment strategy to simulate.
     * @param request.bond The bond definition used for each tranche simulation.
     * @param request.initialAmount The amount invested at month 0.
     * @param request.recurringAmount The amount invested at each recurring
     *   contribution date (every `frequencyMonths`), if greater than zero.
     * @param request.frequencyMonths The interval, in months, between recurring
     *   contributions. Must be positive when `recurringAmount` > 0.
     * @param request.durationMonths Total duration of the strategy, in months,
     *   from the initial investment.
     * @param request.inflationRate Annual inflation rate (as a fraction) that
     *   may be used to adjust values within the underlying bond simulations.
     * @param request.reinvest Whether returns (e.g., coupons, matured principal)
     *   are reinvested into new tranches when possible.
     *
     * @returns A {@link StrategyResult} containing the month‑by‑month timeline
     *   of total invested capital, total portfolio value, and aggregated gross
     *   and net profit across all tranches.

---

src/app/components/investment-strategy/investment-strategy.ts
        if (this.frequencyMonths <= 0 || this.durationMonths <= 0 || this.inflationRate < 0) {
            console.warn('Invalid inputs detected', { frequencyMonths: this.frequencyMonths, durationMonths: this.durationMonths, inflationRate: this.inflationRate });
            return;
    updateConfigValue(config: BondStrategyConfig, field: keyof BondStrategyConfig, value: any) {
Copilot AI
6 minutes ago
The 'value' parameter is typed as 'any', which defeats TypeScript's type safety. Consider using a generic type or a union type to ensure type safety based on the field being updated. For example: updateConfigValue(config: BondStrategyConfig, field: K, value: BondStrategyConfig[K])

Suggested change
from:    updateConfigValue(config: BondStrategyConfig, field: keyof BondStrategyConfig, value: any) {
to:    updateConfigValue<K extends keyof BondStrategyConfig>(config: BondStrategyConfig, field: K, value: BondStrategyConfig[K]) {

---

src/app/components/investment-strategy/investment-strategy.ts
Comment on lines +65 to 67
    constructor() {
    }

Copilot AI
7 minutes ago
Empty constructor serves no purpose and can be removed. Angular components don't need an explicit constructor unless they're performing initialization logic.

Suggested change
    constructor() {
    }

---

src/app/logic/bond-calculator.spec.ts
@@ -1,7 +1,17 @@
import { BondCalculator } from './bond-calculator';
import { TestBed } from '@angular/core/testing';
import { BondCalculatorService, BondCalculatorService as BondCalculator } from './bond-calculator';
Copilot AI
7 minutes ago
Redundant import alias. The service is imported as 'BondCalculatorService' and then aliased to 'BondCalculator', but the alias is never used in the file. Remove the alias and use 'BondCalculatorService' directly throughout the file.

Suggested change
from: import { BondCalculatorService, BondCalculatorService as BondCalculator } from './bond-calculator';
to: import { BondCalculatorService } from './bond-calculator';

---

src/app/components/investment-strategy/investment-strategy.html
                <label>Czas trwania</label>
                <input type="range" [(ngModel)]="durationMonths" (ngModelChange)="calculate()" min="1" max="120"
                    step="1" list="strategy-markers">
                <label>Czas trwania</label>
Copilot AI
7 minutes ago
Duplicate label element. The label 'Czas trwania' appears twice on consecutive lines. Remove the duplicate label on line 21.

Suggested change
                <label>Czas trwania</label>

---

src/app/components/portfolio-analysis/portfolio-analysis.ts
    imports: [CommonModule, FormsModule, BaseChartDirective],
    templateUrl: './portfolio-analysis.html',
    styleUrl: './portfolio-analysis.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
Copilot AI
8 minutes ago
Using OnPush change detection strategy with mutable state mutations is problematic. The component directly mutates arrays (portfolio, summary, pieChartData, profitChartData) in the calculate() method, but OnPush change detection won't detect these mutations. This will cause the UI to not update when calculate() is called. Either remove OnPush change detection, or refactor to use immutable patterns (signals, immutable updates) like the other components in this PR.

Suggested change
    changeDetection: ChangeDetectionStrategy.OnPush,

---

src/app/components/investment-strategy/investment-strategy.ts
@@ -1,10 +1,11 @@
import { Component, OnInit } from '@angular/core';
import { Component, ChangeDetectionStrategy, inject, signal, effect, computed } from '@angular/core';
Copilot AI
8 minutes ago
Unused import effect.

Suggested change
from: import { Component, ChangeDetectionStrategy, inject, signal, effect, computed } from '@angular/core';
to: import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';

---

rc/app/components/portfolio-analysis/portfolio-analysis.ts
import { ChartConfiguration, ChartData, ChartDataset, ChartType } from 'chart.js';
import { Bond, BondType, Constants } from '../../logic/constants';
import { BondCalculator, EarlyRedemptionResult, SimulationResult } from '../../logic/bond-calculator';
import { BondCalculatorService, EarlyRedemptionResult, SimulationResult } from '../../logic/bond-calculator';
Copilot AI
8 minutes ago
Unused imports EarlyRedemptionResult, SimulationResult.

Suggested change
from: import { BondCalculatorService, EarlyRedemptionResult, SimulationResult } from '../../logic/bond-calculator';
to: import { BondCalculatorService } from '../../logic/bond-calculator';

---

src/app/logic/chart-config.service.ts
@@ -0,0 +1,63 @@
import { Injectable } from '@angular/core';
import { ChartConfiguration, ChartType } from 'chart.js';
Copilot AI
8 minutes ago
Unused import ChartType.

Suggested change
from: import { ChartConfiguration, ChartType } from 'chart.js';
to: import { ChartConfiguration } from 'chart.js';
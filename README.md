# Polish Treasury Bonds Analyser

**Live Application:** [https://obligacje-skarbowe.pl/](https://obligacje-skarbowe.pl/)

## Overview

**Polish Treasury Bonds Analyser** is a comprehensive tool designed to help individual investors simulate, analyze, and optimize their returns on Polish Treasury Bonds ("Obligacje Skarbowe"). Whether you are planning a one-time investment or a long-term saving strategy with monthly contributions, this application provides detailed insights into potential profits, taxes, and inflation protection.

This project is built with **Angular (v21+)**, utilizing the latest features such as **Signals** and **OnPush Change Detection** for high performance and reactivity.

## Key Features

### Individual Bond Calculator
Analyze the performance of specific bond types available in Poland:
-   **Fixed Floating Rate Bonds**: OTS (3-month), ROR (1-year), DOR (2-year).
-   **Fixed Rate Bonds**: TOS (3-year).
-   **Inflation-Indexed Bonds**: COI (4-year), EDO (10-year).

**Capabilities:**
-   Simulate returns over any custom duration.
-   Adjust **Inflation Scenarios** to see how indexed bonds perform.
-   Calculate **Belka Tax** (Capital Gains Tax) automatically.
-   Account for **Early Redemption Fees** if withdrawing before maturity.

### Investment Strategy Simulator
Plan long-term wealth building with advanced simulation tools:
-   **Dollar Cost Averaging (DCA)**: Simulate regular monthly contributions.
-   **Reinvestment Logic**: Automatically reinvest paid interest and matured capital into new bonds ("percent scładany").
-   **Unified Timeline**: Visualize the total value of your accumulated capital over 10+ years.

### Portfolio Analysis
Build a diversified portfolio to balance risk and liquidity:
-   Mix and match different bond types (e.g., 50% Inflation-Indexed + 50% Short-term).
-   Visualize portfolio structure (Pie Chart).
-   See the aggregate simulated value over time (Line Chart).
-   Receive **Optimization Tips** based on your investment horizon.

## How to Use

1.  **Select a Bond**: Navigate to the main page to see quick cards for each bond type.
2.  **Adjust Parameters**: Use the sliders to set your investment amount and expected inflation rate.
3.  **Analyze & Compare**: View the "Profit vs Inflation" charts to understand real returns.
4.  **Strategize**: Go to the "Investment Strategy" tab to simulate recurring savings plans.
5.  **Direct Purchase**: Links are provided to the official government site for actual purchases (this tool is for analysis only).

## Disclaimer

This application is for **educational and informational purposes only**. It does not constitute financial advice. Simulations are based on mathematical models and current bond letters, but future inflation rates and interest rates are unpredictable. Always verify details with the official [obligacjeskarbowe.pl](https://www.obligacjeskarbowe.pl/) resources before investing.

import { Injectable } from '@angular/core';
import { BondType } from '../logic/constants';

interface PortfolioBondSelection {
  bondType: BondType;
}

@Injectable({
  providedIn: 'root',
})
export class PortfolioAdvisorService {
  getOptimizationTip(horizonMonths: number, items: readonly PortfolioBondSelection[]): string {
    if (horizonMonths <= 3) {
      if (items.some((item) => item.bondType !== BondType.OTS)) {
        return 'Dla bardzo krótkiego okresu (do 3 miesięcy) obligacje OTS są zazwyczaj najlepsze, gdyż nie mają opłaty za wcześniejszy wykup.';
      }
      return 'Twój portfel wygląda optymalnie dla krótkiego horyzontu czasowego.';
    }

    if (horizonMonths >= 12 && horizonMonths < 36) {
      if (items.some((item) => item.bondType === BondType.OTS)) {
        return 'Dla okresu powyżej roku, obligacje indeksowane inflacją (np. COI) mogą przynieść wyższy zysk niż krótkoterminowe OTS.';
      }
      return 'Dla średniego horyzontu warto rozważyć dywersyfikację między obligacjami stałoprocentowymi a indeksowanymi inflacją.';
    }

    return 'Dla długiego horyzontu (powyżej 3 lat) obligacje EDO (10-letnie) zazwyczaj oferują najlepszy zwrot dzięki procentowi składanemu.';
  }
}

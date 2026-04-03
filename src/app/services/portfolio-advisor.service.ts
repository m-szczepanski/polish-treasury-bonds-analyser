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

    if (horizonMonths >= 4 && horizonMonths < 12) {
      if (items.some((item) => item.bondType !== BondType.OTS && item.bondType !== BondType.ROR)) {
        return 'Dla horyzontu 4-11 miesięcy warto preferować obligacje krótszego terminu (OTS lub ROR), aby ograniczyć ryzyko kosztownego wcześniejszego wykupu.';
      }
      return 'Twój portfel wygląda rozsądnie dla horyzontu 4-11 miesięcy.';
    }

    if (horizonMonths >= 12 && horizonMonths < 36) {
      if (items.some((item) => item.bondType === BondType.OTS)) {
        return 'Dla okresu powyżej roku, obligacje indeksowane inflacją (np. COI) mogą przynieść wyższy zysk niż krótkoterminowe OTS.';
      }
      return 'Dla średniego horyzontu warto rozważyć dywersyfikację między obligacjami stałoprocentowymi a indeksowanymi inflacją.';
    }

    if (horizonMonths >= 36) {
      return 'Dla długiego horyzontu (powyżej 3 lat) obligacje EDO (10-letnie) zazwyczaj oferują najlepszy zwrot dzięki procentowi składanemu.';
    }

    return 'Dobierz typ obligacji do planowanego horyzontu inwestycyjnego.';
  }
}

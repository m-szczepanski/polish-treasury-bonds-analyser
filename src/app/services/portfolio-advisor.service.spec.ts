import { TestBed } from '@angular/core/testing';
import { BondType } from '../logic/constants';
import { PortfolioAdvisorService } from './portfolio-advisor.service';

describe('PortfolioAdvisorService', () => {
  let service: PortfolioAdvisorService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PortfolioAdvisorService] });
    service = TestBed.inject(PortfolioAdvisorService);
  });

  it('returns short-horizon warning when non-OTS bonds are present', () => {
    const tip = service.getOptimizationTip(3, [{ bondType: BondType.EDO }]);
    expect(tip).toContain('obligacje OTS są zazwyczaj najlepsze');
  });

  it('returns short-horizon positive tip for OTS-only portfolio', () => {
    const tip = service.getOptimizationTip(2, [{ bondType: BondType.OTS }]);
    expect(tip).toContain('portfel wygląda optymalnie');
  });

  it('returns 4-11 month warning for portfolio containing bonds outside OTS/ROR', () => {
    const tip = service.getOptimizationTip(6, [{ bondType: BondType.EDO }]);
    expect(tip).toContain('4-11 miesięcy');
    expect(tip).toContain('OTS lub ROR');
  });

  it('returns 4-11 month positive tip for OTS-only portfolio', () => {
    const tip = service.getOptimizationTip(6, [{ bondType: BondType.OTS }]);
    expect(tip).toContain('portfel wygląda rozsądnie');
  });

  it('does not return OTS/ROR warning for 4-11 month ROR-only portfolio', () => {
    const tip = service.getOptimizationTip(6, [{ bondType: BondType.ROR }]);
    expect(tip).toContain('portfel wygląda rozsądnie');
    expect(tip).not.toContain('OTS lub ROR');
  });

  it('returns medium-horizon inflation-indexed tip when OTS exists', () => {
    const tip = service.getOptimizationTip(24, [{ bondType: BondType.OTS }]);
    expect(tip).toContain('mogą przynieść wyższy zysk');
  });

  it('returns medium-horizon diversification tip when OTS is absent', () => {
    const tip = service.getOptimizationTip(24, [{ bondType: BondType.COI }]);
    expect(tip).toContain('dywersyfikację');
  });

  it('returns long-horizon EDO tip', () => {
    const tip = service.getOptimizationTip(60, [{ bondType: BondType.ROR }]);
    expect(tip).toContain('obligacje EDO');
  });
});

import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { vi } from 'vitest';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let titleSpy: { setTitle: ReturnType<typeof vi.fn> };
  let metaSpy: { updateTag: ReturnType<typeof vi.fn> };

  const createDocumentMock = () => {
    const canonicalLink = {
      setAttribute: vi.fn(),
    };

    return {
      location: {
        origin: 'https://example.test',
        pathname: '/portfolio',
      },
      head: {
        appendChild: vi.fn(),
      },
      querySelector: vi.fn().mockReturnValue(null),
      createElement: vi.fn().mockReturnValue(canonicalLink),
      canonicalLink,
    };
  };

  beforeEach(() => {
    titleSpy = { setTitle: vi.fn() };
    metaSpy = { updateTag: vi.fn() };
  });

  it('sets full metadata and creates canonical link with default keywords', () => {
    const docMock = createDocumentMock();

    TestBed.configureTestingModule({
      providers: [
        SeoService,
        { provide: Title, useValue: titleSpy as unknown as Title },
        { provide: Meta, useValue: metaSpy as unknown as Meta },
        { provide: DOCUMENT, useValue: docMock },
      ],
    });

    service = TestBed.inject(SeoService);
    service.setPageData('Strategia', 'Opis strony');

    expect(titleSpy.setTitle).toHaveBeenCalledWith('Strategia | Kalkulator Obligacji Skarbowych');
    expect(metaSpy.updateTag).toHaveBeenCalledWith({ name: 'description', content: 'Opis strony' });
    expect(metaSpy.updateTag).toHaveBeenCalledWith({
      name: 'keywords',
      content: 'obligacje skarbowe, kalkulator obligacji, oszczędzanie, inwestowanie',
    });
    expect(metaSpy.updateTag).toHaveBeenCalledWith({ property: 'og:url', content: 'https://example.test/portfolio' });
    expect(docMock.createElement).toHaveBeenCalledWith('link');
    expect(docMock.head.appendChild).toHaveBeenCalled();
    expect(docMock.canonicalLink.setAttribute).toHaveBeenCalledWith('href', 'https://example.test/portfolio');
  });

  it('uses provided keywords and updates existing canonical link', () => {
    const existingLink = {
      setAttribute: vi.fn(),
    };

    const docMock = createDocumentMock();
    docMock.querySelector.mockReturnValue(existingLink);

    TestBed.configureTestingModule({
      providers: [
        SeoService,
        { provide: Title, useValue: titleSpy as unknown as Title },
        { provide: Meta, useValue: metaSpy as unknown as Meta },
        { provide: DOCUMENT, useValue: docMock },
      ],
    });

    service = TestBed.inject(SeoService);
    service.setPageData('Analiza', 'Opis analizy', 'custom,keywords');

    expect(metaSpy.updateTag).toHaveBeenCalledWith({ name: 'keywords', content: 'custom,keywords' });
    expect(docMock.createElement).not.toHaveBeenCalled();
    expect(existingLink.setAttribute).toHaveBeenCalledWith('href', 'https://example.test/portfolio');
  });
});

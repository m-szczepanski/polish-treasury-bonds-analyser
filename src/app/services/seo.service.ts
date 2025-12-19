import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class SeoService {
    private static readonly DEFAULT_KEYWORDS = 'obligacje skarbowe, kalkulator obligacji, oszczędzanie, inwestowanie';

    private titleService = inject(Title);
    private metaService = inject(Meta);
    private document = inject(DOCUMENT);

    public setPageData(title: string, description: string, keywords?: string): void {
        const fullTitle = `${title} | Kalkulator Obligacji Skarbowych`;
        const effectiveKeywords = keywords ?? SeoService.DEFAULT_KEYWORDS;
        const cleanUrl = this.document.location.origin + this.document.location.pathname;

        this.titleService.setTitle(fullTitle);

        this.metaService.updateTag({ name: 'description', content: description });
        this.metaService.updateTag({ name: 'keywords', content: effectiveKeywords });

        // Open Graph
        this.metaService.updateTag({ property: 'og:title', content: fullTitle });
        this.metaService.updateTag({ property: 'og:description', content: description });
        this.metaService.updateTag({ property: 'og:type', content: 'website' });
        this.metaService.updateTag({ property: 'og:url', content: cleanUrl });
        this.metaService.updateTag({ property: 'og:site_name', content: 'Kalkulator Obligacji Skarbowych' });
        this.metaService.updateTag({ property: 'og:locale', content: 'pl_PL' });

        // Canonical URL
        this.updateCanonicalURL(cleanUrl);
    }

    private updateCanonicalURL(url: string) {
        let link: HTMLLinkElement | null = this.document.querySelector("link[rel='canonical']");
        if (!link) {
            link = this.document.createElement('link');
            link.setAttribute('rel', 'canonical');
            this.document.head.appendChild(link);
        }
        link.setAttribute('href', url);
    }
}

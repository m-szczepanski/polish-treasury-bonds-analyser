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

        this.titleService.setTitle(fullTitle);

        this.metaService.updateTag({ name: 'description', content: description });
        this.metaService.updateTag({ name: 'keywords', content: effectiveKeywords });

        this.metaService.updateTag({ property: 'og:title', content: fullTitle });
        this.metaService.updateTag({ property: 'og:description', content: description });
        this.metaService.updateTag({ property: 'og:type', content: 'website' });
        this.metaService.updateTag({ property: 'og:url', content: this.document.URL });

        this.updateCanonicalURL();
    }

    private updateCanonicalURL() {
        let link: HTMLLinkElement | null = this.document.querySelector("link[rel='canonical']");
        if (!link) {
            link = this.document.createElement('link');
            link.setAttribute('rel', 'canonical');
            this.document.head.appendChild(link);
        }
        link.setAttribute('href', this.document.URL);
    }
}

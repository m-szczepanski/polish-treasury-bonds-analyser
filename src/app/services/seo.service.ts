import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class SeoService {
    private titleService = inject(Title);
    private metaService = inject(Meta);
    private document = inject(DOCUMENT);

    public setPageData(title: string, description: string, keywords: string = 'obligacje skarbowe, kalkulator obligacji, oszczędzanie, inwestowanie'): void {
        const fullTitle = `${title} | Kalkulator Obligacji Skarbowych`;

        // Set Title
        this.titleService.setTitle(fullTitle);

        // Set Meta Tags
        this.metaService.updateTag({ name: 'description', content: description });
        this.metaService.updateTag({ name: 'keywords', content: keywords });

        // Open Graph
        this.metaService.updateTag({ property: 'og:title', content: fullTitle });
        this.metaService.updateTag({ property: 'og:description', content: description });
        this.metaService.updateTag({ property: 'og:type', content: 'website' });

        // Canonical URL (optional but good practice)
        this.createLinkForCanonicalURL();
    }

    private createLinkForCanonicalURL() {
        let link: HTMLLinkElement = this.document.querySelector("link[rel='canonical']") || this.document.createElement('link');
        link.setAttribute('rel', 'canonical');
        this.document.head.appendChild(link);
        link.setAttribute('href', this.document.URL);
    }
}

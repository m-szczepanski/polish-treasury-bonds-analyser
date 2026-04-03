import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface InternalMenuItem {
    kind: 'internal';
    label: string;
    route: string;
    exact?: boolean;
}

interface ExternalMenuItem {
    kind: 'external';
    label: string;
    href: string;
}

type MenuItem = InternalMenuItem | ExternalMenuItem;

@Component({
    selector: 'app-top-menu',
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './top-menu.html',
    styleUrl: './top-menu.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopMenuComponent {
    readonly menuItems: readonly MenuItem[] = [
        {
            kind: 'internal',
            label: 'Kalkulator',
            route: '/',
            exact: true
        },
        {
            kind: 'internal',
            label: 'Strategia Inwestycyjna',
            route: '/strategy'
        },
        {
            kind: 'internal',
            label: 'Analiza portfela',
            route: '/analysis'
        },
        {
            kind: 'external',
            label: 'Obligacje Skarbowe',
            href: 'https://www.obligacjeskarbowe.pl/'
        }
    ];
}

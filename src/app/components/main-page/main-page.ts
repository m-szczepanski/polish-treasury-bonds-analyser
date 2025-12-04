import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BondCardComponent } from '../bond-card/bond-card';
import { Constants } from '../../logic/constants';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, BondCardComponent],
  templateUrl: './main-page.html',
  styleUrl: './main-page.css',
})
export class MainPageComponent {
  bonds = Constants.BONDS;
}

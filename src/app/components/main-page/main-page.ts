import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BondCardComponent } from '../bond-card/bond-card';
import { Constants } from '../../logic/constants';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, FormsModule, BondCardComponent],
  templateUrl: './main-page.html',
  styleUrl: './main-page.css',
})
export class MainPageComponent {
  bonds = Constants.BONDS;
  investmentAmount = 1000;
}

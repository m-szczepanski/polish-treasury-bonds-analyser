import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent {
  bonds = Constants.BONDS; // Constant, no signal needed for list itself if static
  investmentAmount = signal(1000);
}

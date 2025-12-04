import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidePanelComponent } from './components/side-panel/side-panel';
import { MainPageComponent } from './components/main-page/main-page';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidePanelComponent, MainPageComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent {
  title = 'polish-treasury-bonds-analyser';
}

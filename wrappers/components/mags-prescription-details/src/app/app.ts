import { Component, signal } from '@angular/core';
import { MagsPrescriptionDetails } from './components/mags/mags-prescription-details.component';

@Component({
  selector: 'app-root',
  imports: [MagsPrescriptionDetails],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('mags-prescription-details');
}

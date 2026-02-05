import { Component, signal } from '@angular/core';
import { MagsPrescriptionList } from './components/mags/mags-prescription-list.component';

@Component({
  selector: 'app-root',
  imports: [MagsPrescriptionList],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('mags-prescription-list');
  ssin = { props: { patientSsin: '80222700163' } };

  open(event: any) {
    console.log('open: ', event);
  }
}

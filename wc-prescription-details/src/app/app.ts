import { Component, signal } from '@angular/core';
import { PrescriptionDetailsWebComponent } from '../containers/prescription-details/prescription-details.component';

@Component({
  selector: 'app-prescription-details',
  imports: [PrescriptionDetailsWebComponent],
  templateUrl: './app.html',
})
export class AppPrescriptionDetails {
  protected readonly title = signal('uhmep-prescription-details');
  patientSsin = '80222700153';
  prescriptionId = 'DEAD0000-0000-4000-A000-000000000001';

  protected readonly services = {
    getAccessToken: (audience?: string) => Promise.resolve('demo'),
    getIdToken: () => {
      return {
        userProfile: {
          ssin: '80222700153',
          firstName: 'John',
          lastName: 'Doe',
          gender: 'M',
        },
      };
    },
  };

  print(event: any) {
    console.log('print: ', event);
  }

  clickOpenExtendedDetail(detail?: string) {
    const ssin = '80222700153';
    this.patientSsin = ssin;
    this.prescriptionId = detail || '';
  }
}

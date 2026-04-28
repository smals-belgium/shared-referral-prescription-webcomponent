import { Component, signal } from '@angular/core';
import { PrescriptionListWebComponent } from '../prescription-list/prescription-list.component';
import { Intent } from '@reuse/code/interfaces';
import { ModelEntityDto, ReadRequestResource } from '@reuse/code/openapi';

@Component({
  selector: 'app-prescription-create',
  imports: [PrescriptionListWebComponent],
  templateUrl: './app.html',
})
export class AppPrescriptionDetails {
  protected readonly title = signal('uhmep-prescription-create');
  patientSsin = '80222700153';
  intent = Intent.ORDER;

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

  clickOpenDetail(detail?: ReadRequestResource | ModelEntityDto) {
    console.log(detail);
  }
}

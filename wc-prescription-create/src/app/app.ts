import { Component, signal } from '@angular/core';
import { CreatePrescriptionWebComponent } from '../create-prescription/create-prescription.component';
import { Lang } from '@reuse/code/constants/languages';

@Component({
  selector: 'app-prescription-create',
  imports: [CreatePrescriptionWebComponent],
  templateUrl: './app.html',
})
export class AppPrescriptionDetails {
  protected readonly Lang = Lang;
  protected readonly title = signal('uhmep-prescription-create');
  patientSsin = '80222700153';
  initialValues = {
    intent: 'order',
    initialPrescriptionType: 'ASSISTING_WITH_PERSONAL_HYGIENE',
  };

  protected readonly services = {
    getAccessToken: (_audience?: string) => Promise.resolve('demo'),
    getIdToken: () => {
      return {
        userProfile: {
          ssin: '80222700153',
          firstName: 'John',
          lastName: 'Doe',
          gender: 'M',
          physician: {
            recognised: true,
            nihii11: '46843080001',
          },
          organizations: [
            {
              otdpharmacy: {
                nihii: '21345678210',
                name: 'Test Hospital',
              },
            },
          ],
        },
      };
    },
  };

  prescriptionsCreated(ids: string[]) {
    console.log(ids);
  }

  clickCancel() {
    console.log('cancel');
  }

  modelCreated() {
    console.log('model created');
  }
}

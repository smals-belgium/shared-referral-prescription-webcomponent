import { createApplication } from '@angular/platform-browser';
import { provideEvfFormDetails } from '@reuse/code/evf/evf-form-details.provider';
import { provideMarkdown } from '@reuse/code/providers/markdown.provider';
import { createCustomElement } from '@angular/elements';
import { provideCore } from '@reuse/code/providers/core.provider';
import { provideAnimations } from '@angular/platform-browser/animations';
import { EvfFormDetailsWebComponent } from './components/evf-details/evf-form-details.component';
import {provideHttpClient} from '@angular/common/http';


(async () => {
  const app = createApplication({providers:[
      provideCore(),
      provideAnimations(),
      provideEvfFormDetails(),
      provideMarkdown(),
      provideHttpClient() // Required by markdown
    ]});

  const evfFormElement = createCustomElement(EvfFormDetailsWebComponent, {
    injector: (await app).injector
  });
  customElements.define('nihdi-referral-prescription-form-details', evfFormElement);
})();

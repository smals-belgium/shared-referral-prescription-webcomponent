import { createApplication } from '@angular/platform-browser';
import { provideEvfForm } from '@reuse/code/evf/evf-form.provider';
import { provideMarkdown } from '@reuse/code/providers/markdown.provider';
import { createCustomElement } from '@angular/elements';
import { EvfFormWebComponent } from './components/evf-form/evf-form.component';
import { provideCore } from '@reuse/code/providers/core.provider';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

(async () => {
  const app = createApplication({
    providers: [
      provideCore(),
      provideHttpClient(),
      provideAnimations(),
      provideEvfForm(),
      provideMarkdown()
    ],
  });
  const evfFormElement = createCustomElement(EvfFormWebComponent, {
    injector: (await app).injector,
  });
  customElements.define('nihdi-referral-prescription-form', evfFormElement);
})();

import { Component } from '@angular/core';
import { EvfBaseFormElementComponent } from '@smals/vas-evaluation-form-ui-material/elements/shared';
import { ResponsiveWrapperComponent } from '@reuse/code/components/responsive-wrapper/responsive-wrapper.component';
import { RadioComponent } from '@smals/vas-evaluation-form-ui-material/elements/radio';
import { SelectComponent } from '@smals/vas-evaluation-form-ui-material/elements/select';
import { CheckboxListComponent } from '@smals/vas-evaluation-form-ui-material/elements/checkbox-list';

@Component({
  selector: 'toggle-responsive-wrapper',
  imports: [ResponsiveWrapperComponent, RadioComponent, SelectComponent, CheckboxListComponent],
  templateUrl: './toggle-responsive-wrapper.component.html',
})
export class ToggleResponsiveWrapperComponent extends EvfBaseFormElementComponent {
  getElementConrol() {
    if (this.element?.custom?.['multi'] && this.elementControl.element) {
      this.elementControl.element.viewType = 'multiselect';
    }

    return this.elementControl;
  }
}

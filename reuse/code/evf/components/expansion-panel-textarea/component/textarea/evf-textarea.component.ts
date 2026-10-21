import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  EvfBaseFormElementComponent,
  EvfElementBodyComponent,
  EvfElementHelpComponent,
  EvfElementLabelComponent,
  EvfFormElementLayoutComponent,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EvfActiveValidationPipe, EvfLabelPipe } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EvfNoWhitespaceDirective } from '@reuse/code/evf/directives/no-whitespace.directive';

@Component({
  selector: 'evf-textarea',
  templateUrl: './evf-textarea.component.html',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FormsModule,
    EvfFormElementLayoutComponent,
    EvfElementHelpComponent,
    EvfElementBodyComponent,
    EvfElementLabelComponent,
    EvfActiveValidationPipe,
    EvfLabelPipe,
    EvfNoWhitespaceDirective,
  ],
})
export class EvfTextareaComponent extends EvfBaseFormElementComponent {
  private static counter = 0;

  readonly id = `evf-textarea-${EvfTextareaComponent.counter++}`;
}

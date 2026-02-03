import { AfterViewInit, Component, inject, signal, ViewChild, WritableSignal } from '@angular/core';
import {
  EvfBaseFormElementComponent,
  EvfElementLabelComponent,
} from '@smals/vas-evaluation-form-ui-material/elements/shared';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { TextareaComponent } from '@smals/vas-evaluation-form-ui-material/elements/textarea';
import { MatIcon } from '@angular/material/icon';
import { EvfActiveValidationPipe, Validation } from '@smals/vas-evaluation-form-ui-core';

@Component({
  selector: 'expansion-panel-textarea',
  imports: [MatExpansionModule, TextareaComponent, EvfElementLabelComponent, MatIcon],
  providers: [EvfActiveValidationPipe],
  templateUrl: './expansion-panel-textarea.component.html',
  styleUrl: './expansion-panel-textarea.component.scss',
  standalone: true,
})
export class ExpansionPanelTextareaComponent extends EvfBaseFormElementComponent implements AfterViewInit {
  @ViewChild('matExpansionPanel') matExpansionPanel!: MatExpansionPanel;

  isExpanded: WritableSignal<boolean> = signal(false);

  protected readonly _activeValidationPipe = inject(EvfActiveValidationPipe);

  private static counter = 0;
  readonly id = 'evf-textarea-' + ExpansionPanelTextareaComponent.counter++;

  ngAfterViewInit(): void {

    const requiredValidation: Validation = this._activeValidationPipe.transform(this.elementControl, 'required');

    if (this.matExpansionPanel && (this.elementControl.value?.length > 0 || !!requiredValidation)) {
      this.matExpansionPanel.open();
    }
  }

  onEventHandling() {
    //Empty
  }
}

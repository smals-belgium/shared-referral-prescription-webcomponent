import { Component } from '@angular/core';
import {
  EvfBaseFormDetailComponent,
  EvfDetailLabelComponent, EvfFormDetailLayoutComponent,
} from '@smals/vas-evaluation-form-ui-material/elements/shared';
import { OccurrenceFrequencyPipe } from '@reuse/code/pipes/occurrence-frequency.pipe';

@Component({
  selector: 'evf-occurrences',
  imports: [EvfDetailLabelComponent, EvfFormDetailLayoutComponent, OccurrenceFrequencyPipe],
  standalone: true,
  templateUrl: './occurrences.component.html',
})
export class OccurrencesComponent extends EvfBaseFormDetailComponent {
}

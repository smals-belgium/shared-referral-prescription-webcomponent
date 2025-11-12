import { Component } from '@angular/core';
import {
  EvfBaseFormDetailComponent,
  EvfDetailLabelComponent,
  EvfFormDetailLayoutComponent,
} from '@smals/vas-evaluation-form-ui-material/elements/shared';
import { OccurrenceDurationPipe } from '@reuse/code/pipes/occurrence-duration.pipe';

@Component({
  selector: 'evf-bounds-duration-detail',
  imports: [EvfDetailLabelComponent, EvfFormDetailLayoutComponent, OccurrenceDurationPipe],
  standalone: true,
  templateUrl: './bounds-duration.component.html',
})
export class BoundsDurationComponent extends EvfBaseFormDetailComponent {}

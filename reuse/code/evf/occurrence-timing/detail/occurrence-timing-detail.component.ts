import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  EvfBaseFormDetailComponent,
  EvfDetailLabelComponent,
  EvfFormDetailLayoutComponent,
} from '@smals/vas-evaluation-form-ui-material/elements/shared';
import { OccurrenceTimingPipe } from '@reuse/code/pipes/occurrence-timing.pipe';

@Component({
  selector: 'evf-occurrence-timing-detail',
  templateUrl: './occurrence-timing-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EvfFormDetailLayoutComponent, EvfDetailLabelComponent, OccurrenceTimingPipe],
})
export class OccurrenceTimingDetailComponent extends EvfBaseFormDetailComponent {}

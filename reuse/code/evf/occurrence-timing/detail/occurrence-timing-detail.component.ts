import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  EvfBaseFormDetailComponent,
  EvfDetailLabelComponent,
  EvfFormDetailLayoutComponent,
} from '@smals/vas-evaluation-form-ui-material/elements/shared';
import { OccurrenceDurationPipe } from '@reuse/code/pipes/occurrence-duration.pipe';

@Component({
  selector: 'evf-occurrence-timing-detail',
  templateUrl: './occurrence-timing-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EvfFormDetailLayoutComponent, EvfDetailLabelComponent, OccurrenceDurationPipe],
  standalone: true
})
export class OccurrenceTimingDetailComponent extends EvfBaseFormDetailComponent {}

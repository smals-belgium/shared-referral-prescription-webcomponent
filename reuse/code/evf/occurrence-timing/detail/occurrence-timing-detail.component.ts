import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  EvfBaseFormDetailComponent,
  EvfDetailLabelComponent,
  EvfFormDetailLayoutComponent
} from '@smals/vas-evaluation-form-ui-material/elements/shared';
import { NgIf } from '@angular/common';
import { OccurrenceTimingPipe } from '../../../pipes/occurrence-timing.pipe';

@Component({
    selector: 'evf-occurrence-timing-detail',
    templateUrl: './occurrence-timing-detail.component.html',
    styleUrls: ['./occurrence-timing-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        EvfFormDetailLayoutComponent,
        EvfDetailLabelComponent,
        NgIf,
        OccurrenceTimingPipe
    ]
})
export class OccurrenceTimingDetailComponent extends EvfBaseFormDetailComponent {
}

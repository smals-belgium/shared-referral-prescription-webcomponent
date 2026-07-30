import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EvfLabelPipe, FormElement } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import {
  EvfDetailLabelComponent,
  EvfFormDetailLayoutComponent,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';
import { MarkdownModule } from 'ngx-markdown';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'evf-info-detail',
  imports: [EvfFormDetailLayoutComponent, EvfDetailLabelComponent, EvfLabelPipe, MarkdownModule, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './info-detail.component.html',
})
export class InfoDetailComponent {
  element = input.required<FormElement>();
}

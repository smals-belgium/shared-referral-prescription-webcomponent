import { Component } from '@angular/core';
import {
  EvfBaseFormDetailComponent,
  EvfDetailLabelComponent,
  EvfFormDetailLayoutComponent,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';

@Component({
  selector: 'evf-auto-checkbox-list-detail',
  imports: [EvfFormDetailLayoutComponent, EvfDetailLabelComponent],
  templateUrl: './auto-checkbox-list-detail.component.html',
})
export class AutoCheckboxListDetailComponent extends EvfBaseFormDetailComponent {}

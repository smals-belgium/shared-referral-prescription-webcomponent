import { Component, OnChanges, SimpleChanges } from '@angular/core';
import {
  BaseElementControl,
  EvfFormDetailGroupComponent,
  EvfLabelPipe,
  Response,
} from '@smals/vas-evaluation-form-ui-core';
import {
  EvfBaseFormDetailComponent,
  EvfDetailLabelComponent,
  EvfFormDetailLayoutComponent,
  EvfInfoIconComponent,
  InlineMarkdownPipe,
} from '@smals/vas-evaluation-form-ui-material/elements/shared';
import { AsyncPipe } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MarkdownModule } from 'ngx-markdown';
import { Intent } from '@reuse/code/interfaces';
import { map, Observable, startWith } from 'rxjs';

interface selectedResponse {
  response: Response;
  subElementsControls: BaseElementControl[];
}

@Component({
  selector: 'evf-proposal-checkbox-list',
  imports: [
    EvfDetailLabelComponent,
    EvfFormDetailLayoutComponent,
    EvfLabelPipe,
    EvfInfoIconComponent,
    InlineMarkdownPipe,
    AsyncPipe,
    MatCheckboxModule,
    MarkdownModule,
    EvfFormDetailGroupComponent,
  ],
  standalone: true,
  styleUrl: 'proposal-checkbox-list.component.scss',
  templateUrl: './proposal-checkbox-list.component.html',
})
export class ProposalCheckboxListComponent extends EvfBaseFormDetailComponent implements OnChanges {
  protected readonly Intent = Intent;

  selectedResponses$: Observable<{ response: Response; subElementsControls: BaseElementControl[] }[]> | undefined;

  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    if (changes['elementControl'] && this.element) {
      this.setResponses();
    }
  }

  private setResponses() {
    this.selectedResponses$ = this.elementControl.valueChanges.pipe(
      startWith(this.elementControl.value),
      map(values => {
        if (!this.element.responses) return [] as selectedResponse[];

        return this.element.responses
          .filter(response => values?.includes(response.value))
          .map(response => ({
            response,
            subElementsControls: this.elementControl.childElementControls.filter(
              (q: BaseElementControl) =>
                q.element?.showIfParentResponse && q.element.showIfParentResponse.includes(response.value)
            ),
          })) as unknown as selectedResponse[];
      })
    );
  }

  getSubElementControls(value: string | number | boolean): BaseElementControl[] {
    return this.elementControl.childElementControls.filter(
      (q: BaseElementControl) => q.element?.showIfParentResponse && q.element.showIfParentResponse.includes(value)
    );
  }

  isChecked(value: unknown): boolean {
    return Boolean(this.elementControl?.value?.includes?.(value));
  }
}

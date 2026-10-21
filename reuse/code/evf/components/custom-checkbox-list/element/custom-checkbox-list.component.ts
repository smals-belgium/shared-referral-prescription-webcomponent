import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CheckboxListComponent } from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/checkbox-list';
import { EvfFormElementGroupComponent, EvfLabelPipe } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  EvfElementBodyComponent,
  EvfElementHelpComponent,
  EvfElementLabelComponent,
  EvfElementSubLabelComponent,
  EvfFormElementLayoutComponent,
  EvfInfoIconComponent,
  InlineMarkdownPipe,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'evf-custom-checkbox-list',
  templateUrl: './custom-checkbox-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  styleUrl: './custom-checkbox-list.component.scss',
  imports: [
    FormsModule,
    MarkdownModule,
    MatFormFieldModule,
    MatCheckboxModule,
    EvfFormElementLayoutComponent,
    EvfElementLabelComponent,
    EvfElementSubLabelComponent,
    EvfElementBodyComponent,
    EvfElementHelpComponent,
    EvfFormElementGroupComponent,
    EvfInfoIconComponent,
    EvfLabelPipe,
    InlineMarkdownPipe,
    NgTemplateOutlet,
    AsyncPipe,
    MatButtonToggleModule,
  ],
})
export class CustomCheckboxListComponent extends CheckboxListComponent {}

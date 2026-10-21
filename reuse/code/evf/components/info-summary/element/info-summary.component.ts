import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import {
  EvfBaseFormElementComponent,
  EvfElementBodyComponent,
  EvfElementHelpComponent,
  EvfElementLabelComponent,
  EvfFormElementLayoutComponent,
} from '@smals-belgium-shared/vas-evaluation-form-ui-material/elements/shared';
import { DateTime } from 'luxon';
import { EvfLabelPipe, EvfTranslateService } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Translation } from '@reuse/code/openapi';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'evf-info-summary',
  templateUrl: './info-summary.component.html',
  styleUrl: './info-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    EvfElementBodyComponent,
    EvfElementHelpComponent,
    EvfElementLabelComponent,
    EvfFormElementLayoutComponent,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
    EvfLabelPipe,
  ],
})
export class InfoSummaryComponent extends EvfBaseFormElementComponent implements OnInit {
  private readonly evfTranslate = inject(EvfTranslateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T.*)?$/;

  private static counter = 0;
  protected readonly id = `evf-info-summary-${InfoSummaryComponent.counter++}`;

  protected formValues: WritableSignal<string> = signal('');
  private readonly currentLang = toSignal(this.evfTranslate.currentLang$, {
    initialValue: this.evfTranslate.currentLang,
  });

  ngOnInit(): void {
    this.evfTranslate.currentLang$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.getFormValues());
  }

  getFormValues() {
    if (this.elementControl) {
      const formGroup = this.elementControl.elementGroup;
      const formValues = formGroup?.getOutputValue() as Record<string, unknown>;
      const keys: string[] | undefined = this.element.custom?.['displayValues'] as string[];

      if (!keys?.length) return;

      const result = keys
        .map(key => this.formatEntry(formValues, key))
        .filter(v => v !== '')
        .join(', ');
      this.formValues.set(result);
    }
  }

  private formatValue(formValue: unknown) {
    if (formValue === undefined || formValue === null || formValue === '') return '';

    if (typeof formValue === 'object' && 'label' in formValue) {
      return (formValue['label'] as Translation)[this.currentLang()] ?? (formValue['label'] as Translation)['en'] ?? '';
    }

    if (Array.isArray(formValue) && formValue.every(v => v && typeof v === 'object' && 'name' in v)) {
      return formValue.map((v: { name: string }) => v.name).join(', ');
    }

    if (Array.isArray(formValue) && formValue.every(v => v && typeof v === 'object' && 'label' in v)) {
      return formValue
        .map((v: { label: Translation }) => v['label'][this.currentLang()] ?? v['label']['en'] ?? '')
        .join(', ');
    }

    if (Array.isArray(formValue)) {
      return formValue.join(', ');
    }

    if (typeof formValue === 'string' && this.ISO_DATE_RE.test(formValue)) {
      const dt = DateTime.fromISO(formValue).setLocale(this.currentLang());
      return dt.isValid ? dt.toFormat('dd/MM/yyyy') : formValue;
    }

    if (typeof formValue === 'string') return formValue;

    return '';
  }

  private formatEntry(formValues: Record<string, unknown>, key: string) {
    const formatted = this.formatValue(formValues[key]);
    if (formatted === '') return '';
    const prefixes = this.element.custom?.['prefixString'] as { [key: string]: string };
    const prefix = prefixes[key] ? this.evfTranslate.instant(prefixes[key]) : '';
    return prefix ? `${prefix} ${formatted}` : formatted;
  }

  previousStep() {
    this.events.emit({ type: 'PREVIOUS_STEP' });
  }
}

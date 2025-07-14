import { Component, EventEmitter, HostBinding, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FormTemplate } from '@smals/vas-evaluation-form-ui-core';
import { EvfTemplate, Person, ReadPrescription } from '@reuse/code/interfaces';
import { PrescriptionsPdfService } from '@reuse/code/services/prescription-pdf.service';

@Component({
  template: '',
  standalone: true
})
export class PdfMakeWebComponent implements OnChanges {

  @HostBinding('attr.lang')
  @Input() lang?: string;
  @Input() prescription!: ReadPrescription;
  @Input() responses!: Record<string, any>;
  @Input() patient!: Person;
  @Input() template!: EvfTemplate;
  @Input() templateVersion!: FormTemplate;

  @Output() pdfReady = new EventEmitter<void>();

  constructor(
    private readonly prescriptionPdfService: PrescriptionsPdfService,
    private readonly translate: TranslateService
  ) {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['lang']) {
      this.translate.use(this.lang!);
    }
    if (this.hasRelevantChange(changes)
      && this.prescription && this.template && this.templateVersion && this.responses) {
      this.prescriptionPdfService.printPDF(
        this.prescription,
        this.responses,
        this.patient,
        this.template,
        this.templateVersion,
        this.translate.currentLang
      );
      this.pdfReady.emit();
    }
  }

  private hasRelevantChange(changes: SimpleChanges): boolean {
    return ['prescription', 'template', 'templateVersion', 'responses'].some(key => key in changes);
  }
}

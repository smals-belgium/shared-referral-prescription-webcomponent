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
  @Input() patient!: Person;
  @Input() template!: EvfTemplate;
  @Input() templateVersion!: FormTemplate;

  @Output() pdfReady = new EventEmitter<void>();

  constructor(
    private prescriptionPdfService: PrescriptionsPdfService,
    private translate: TranslateService
  ) {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['lang']) {
      this.translate.use(this.lang!);
    }
    if (changes['prescription'] && this.prescription && this.template && this.templateVersion) {
      this.prescriptionPdfService.printPDF(
        this.prescription,
        this.patient,
        this.template,
        this.templateVersion,
        this.translate.currentLang
      );
      this.pdfReady.emit();
    }
  }
}

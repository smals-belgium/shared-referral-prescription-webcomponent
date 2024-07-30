import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  Signal,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ElementGroup, FormTemplate, removeNulls } from '@smals/vas-evaluation-form-ui-core';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { FormatSsinPipe } from '../../pipes/format-ssin.pipe';
import { TemplateNamePipe } from '../../pipes/template-name.pipe';
import { CreatePrescriptionCardComponent } from '../create-prescription-card/create-prescription-card.component';
import { IfStatusSuccessDirective } from '../../directives/if-status-success.directive';
import { IfStatusErrorDirective } from '../../directives/if-status-error.directive';
import { OverlaySpinnerComponent } from '../overlay-spinner/overlay-spinner.component';
import { IfStatusLoadingDirective } from '../../directives/if-status-loading.directive';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {DataState, LoadingStatus, OccurrenceTiming, Person, ReadPrescription} from '../../interfaces';

export interface CreatePrescriptionForm {
  trackId: number;
  templateCode: string;
  elementGroup?: ElementGroup;
  formTemplateState$: Signal<DataState<FormTemplate>>;
  submitted?: boolean;
  status?: LoadingStatus;
  initialPrescription?: ReadPrescription;
}

@Component({
  selector: 'app-create-multiple-prescriptions',
  templateUrl: './create-multiple-prescriptions.component.html',
  styleUrls: ['./create-multiple-prescriptions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    TranslateModule,
    MatExpansionModule,
    NgFor,
    NgIf,
    MatIconModule,
    MatButtonModule,
    IfStatusLoadingDirective,
    OverlaySpinnerComponent,
    IfStatusErrorDirective,
    IfStatusSuccessDirective,
    CreatePrescriptionCardComponent,
    AsyncPipe,
    TemplateNamePipe,
    FormatSsinPipe
  ]
})
export class CreateMultiplePrescriptionsComponent implements OnChanges {

  readonly trackByFn = (index: number, item: CreatePrescriptionForm) => item?.trackId;

  @Input() lang!: string;
  @Input() patient!: Person;
  @Input() createPrescriptionForms: CreatePrescriptionForm[] = [];

  @Output() clickAddPrescription = new EventEmitter<void>();
  @Output() clickDeletePrescription = new EventEmitter<{ form: CreatePrescriptionForm; templateName: string }>();
  @Output() clickPublish = new EventEmitter<void>();
  @Output() clickCancel = new EventEmitter<void>();

  @ViewChild(MatAccordion, {static: true}) accordion!: MatAccordion;

  get numberOfPrescriptionsToCreate(): number {
    return this.createPrescriptionForms.filter((f) => f.status !== LoadingStatus.SUCCESS).length;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['createPrescriptionForms'] && this.createPrescriptionForms?.length === 1) {
      setTimeout(() => this.accordion.openAll(), 1);
    }
  }

  mapResponsesToRepeatObject(responses: Record<string, any>) {
    const occurrenceTiming: OccurrenceTiming = responses['occurrenceTiming']
    if(!occurrenceTiming) return responses;

    const repeat = occurrenceTiming.repeat
    if(!repeat) return responses

    if(!repeat.count) return {...responses, ...repeat}

    let dayPeriod = {}
    if(repeat.when) {
      if(repeat.when.length === 1) {
        dayPeriod = { dayPeriod: repeat.when[0] }
      } else {
        dayPeriod = { dayPeriod: repeat.when }
      }
    }

    const maxSessions = {nbSessions: repeat.count}
    return {...responses, ...maxSessions, ...dayPeriod, ...repeat}
  }

  setElementGroup(prescriptionForm: CreatePrescriptionForm, formTemplate: FormTemplate, elementGroup: ElementGroup) {
    prescriptionForm.elementGroup = elementGroup;
    if (prescriptionForm.initialPrescription) {
      let responses = removeNulls(prescriptionForm.initialPrescription?.responses || {});
      responses = this.mapResponsesToRepeatObject(responses)
      elementGroup.setValue({
        ...elementGroup.getOutputValue(),
        ...responses
      });
    }
  }
}

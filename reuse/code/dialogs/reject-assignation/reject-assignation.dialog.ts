import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { NgIf } from '@angular/common';
import { TemplateNamePipe } from '../../pipes/template-name.pipe';
import { PerformerTask, Person, ReadPrescription } from '../../interfaces';
import { OverlaySpinnerComponent } from '../../components/overlay-spinner/overlay-spinner.component';
import { ToastService } from '../../services/toast.service';
import { PrescriptionState } from '../../states/prescription.state';
import { v4 as uuidv4 } from 'uuid';
import { ErrorCardComponent } from '../../components/error-card/error-card.component';
import { BaseDialog } from '../base.dialog';
import { ProposalState } from '@reuse/code/states/proposal.state';
import { isProposal } from '@reuse/code/utils/utils';
import { Observable } from 'rxjs';
import { TranslateByIntentPipe } from '@reuse/code/pipes/translate-by-intent.pipe';

interface RejectAssignationDialogData {
  prescription: ReadPrescription;
  performerTask: PerformerTask;
  patient: Person;
}

@Component({
    templateUrl: './reject-assignation.dialog.html',
    styleUrls: ['./reject-assignation.dialog.scss'],
    imports: [
        TranslateModule,
        MatDialogModule,
        MatButtonModule,
        OverlaySpinnerComponent,
        TemplateNamePipe,
        NgIf,
        ErrorCardComponent,
        TranslateByIntentPipe
    ]
})
export class RejectAssignationDialog extends BaseDialog implements OnInit {

  readonly prescription: ReadPrescription;
  readonly patient: Person;
  readonly performerTask: PerformerTask;
  loading = false;
  generatedUUID = '';

  constructor(
    private readonly prescriptionStateService: PrescriptionState,
    private readonly proposalStateService: ProposalState,
    private readonly toastService: ToastService,
    dialogRef: MatDialogRef<RejectAssignationDialog>,
    @Inject(MAT_DIALOG_DATA) private readonly data: RejectAssignationDialogData
  ) {
    super(dialogRef)
    this.prescription = data.prescription;
    this.patient = data.patient;
    this.performerTask = data.performerTask;
  }

  ngOnInit() {
    this.generatedUUID = uuidv4();
  }

  onReject(): void {
    this.loading = true;
    if(isProposal(this.prescription.intent)){
      this.rejectAssignment(() =>this.proposalStateService.rejectAssignation(this.prescription.id, this.performerTask.id, this.generatedUUID), 'proposal');
    }
    else{
      this.rejectAssignment(() =>this.prescriptionStateService.rejectAssignation(this.prescription.id, this.performerTask.id, this.generatedUUID), 'prescription');
    }
  }

  private rejectAssignment(serviceCall: () => Observable<void>, successPrefix : string){
    this.loading = true;

    serviceCall().subscribe({
      next: () => {
        this.closeErrorCard();
        this.toastService.show(successPrefix + '.rejectAssignation.success');
        this.closeDialog(true);
      },
      error: (err) => {
        this.loading = false;
        this.showErrorCard('common.somethingWentWrong', err)
      }
    });
  }
}

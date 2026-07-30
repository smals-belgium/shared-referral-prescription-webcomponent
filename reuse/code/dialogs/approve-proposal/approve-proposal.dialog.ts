import { Component, inject, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { v4 as uuidv4 } from 'uuid';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { TranslateModule } from '@ngx-translate/core';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { PrescriptionResource, ReadRequestResource } from '@reuse/code/openapi';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { EncryptionHelperService } from '@reuse/code/states/privacy/encryption-helper.service';
import { AlertType } from '@reuse/code/interfaces';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { finalize } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { mapIdTokenToPrescriber } from '@reuse/code/utils/idToken.utils';

@Component({
  selector: 'approve-proposal',
  imports: [
    FormsModule,
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatError,
    MatFormField,
    MatInput,
    OverlaySpinnerComponent,
    TranslateModule,
    ReactiveFormsModule,
    MatDialogClose,
    AlertComponent,
  ],
  templateUrl: './approve-proposal.dialog.html',
  styleUrl: './approve-proposal.dialog.scss',
})
export class ApproveProposalDialog implements OnInit, OnDestroy {
  private readonly _authService = inject(AuthService);
  protected readonly discipline$ = toSignal(this._authService.discipline());
  protected readonly oidc$ = toSignal(this._authService.oidc());
  protected readonly claims$ = toSignal(this._authService.getClaims());

  protected readonly AlertType = AlertType;
  private readonly alertService = inject(AlertService);

  private readonly ERROR_APPROVE_PROPOSAL_DIALOG = 'approve-proposal-dialog';
  protected readonly error = this.alertService.setTarget(this.ERROR_APPROVE_PROPOSAL_DIALOG);

  readonly formGroup = new FormGroup({
    reason: new FormControl<string>(''),
  });

  loading = false;
  generatedUUID = '';

  constructor(
    private readonly toastService: ToastService,
    private readonly proposalStateService: ProposalState,
    private readonly encryptionHelperService: EncryptionHelperService,
    private readonly dialogRef: MatDialogRef<ApproveProposalDialog>,
    @Inject(MAT_DIALOG_DATA)
    private readonly data: {
      proposal: ReadRequestResource;
    }
  ) {}

  ngOnInit() {
    this.generatedUUID = uuidv4();
    this.alertService.setActive(this.ERROR_APPROVE_PROPOSAL_DIALOG);
  }

  approveProposal(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) {
      return;
    }

    if (!this.data.proposal.id) {
      this.alertService.showGeneralError(this.ERROR_APPROVE_PROPOSAL_DIALOG);
      return;
    }
    this.loading = true;
    const reason = this.formGroup.get('reason')?.value ?? undefined;

    this.encryptionHelperService
      .getEncryptedReasonAndPseudoKey(reason, this.data.proposal?.pseudonymizedKey)
      .pipe(
        catchError(() => {
          this.alertService.showGeneralError(this.ERROR_APPROVE_PROPOSAL_DIALOG);
          return EMPTY;
        }),
        switchMap(result =>
          this.proposalStateService.approveProposal(
            this.data.proposal.id!,
            {
              reason: result?.encryptedText,
              kid: this.data.proposal?.kid,
              pseudonymizedKey: result?.pseudonymizedKey,
              prescriber: mapIdTokenToPrescriber(this.claims$(), this.discipline$(), this.oidc$()),
            },
            this.generatedUUID
          )
        ),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: e => {
          this.handleSuccess(e);
        },
      });
  }

  private handleSuccess(e: PrescriptionResource): void {
    this.toastService.show('proposal.approve.success');
    this.dialogRef.close({ prescriptionId: e.prescriptionId });
  }

  protected dismissError() {
    this.alertService.clear(this.ERROR_APPROVE_PROPOSAL_DIALOG);
  }

  ngOnDestroy() {
    this.clearAlertService();
  }

  clearAlertService() {
    this.alertService.resetActive();
    this.alertService.remove(this.ERROR_APPROVE_PROPOSAL_DIALOG);
  }
}

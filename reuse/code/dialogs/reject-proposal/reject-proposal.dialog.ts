import { Component, inject, Inject, OnDestroy, OnInit } from '@angular/core';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MatButton } from '@angular/material/button';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { v4 as uuidv4 } from 'uuid';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { ReadRequestResource } from '@reuse/code/openapi';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { EncryptionHelperService } from '@reuse/code/states/privacy/encryption-helper.service';
import { AlertType } from '@reuse/code/interfaces';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { finalize } from 'rxjs/operators';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { mapIdTokenToPrescriber } from '@reuse/code/utils/idToken.utils';

@Component({
  imports: [
    OverlaySpinnerComponent,
    MatDialogModule,
    TranslateModule,
    MatButton,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatError,
    FormsModule,
    AlertComponent,
  ],
  templateUrl: './reject-proposal.dialog.html',
  styleUrl: './reject-proposal.dialog.scss',
})
export class RejectProposalDialog implements OnInit, OnDestroy {
  private readonly _authService = inject(AuthService);
  protected readonly discipline$ = toSignal(this._authService.discipline());
  protected readonly oidc$ = toSignal(this._authService.oidc());
  protected readonly claims$ = toSignal(this._authService.getClaims());
  private readonly alertService = inject(AlertService);

  private readonly ERROR_REJECT_PROPOSAL_DIALOG = 'reject-proposal-dialog';
  protected readonly error = this.alertService.setTarget(this.ERROR_REJECT_PROPOSAL_DIALOG);

  protected readonly AlertType = AlertType;
  readonly formGroup = new FormGroup({
    reason: new FormControl<string>(''),
  });

  loading = false;
  generatedUUID = '';

  constructor(
    private readonly toastService: ToastService,
    private readonly proposalStateService: ProposalState,
    private readonly encryptionHelperService: EncryptionHelperService,
    private readonly dialogRef: MatDialogRef<RejectProposalDialog>,
    @Inject(MAT_DIALOG_DATA)
    private readonly data: {
      proposal: ReadRequestResource;
    }
  ) {}

  ngOnInit() {
    this.generatedUUID = uuidv4();
    this.alertService.setActive(this.ERROR_REJECT_PROPOSAL_DIALOG);
  }

  rejectProposal(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) {
      return;
    }

    const reason = this.formGroup.get('reason')?.value ?? undefined;

    if (!this.data.proposal.id) {
      this.alertService.showGeneralError(this.ERROR_REJECT_PROPOSAL_DIALOG);
      return;
    }

    this.loading = true;
    this.encryptionHelperService
      .getEncryptedReasonAndPseudoKey(reason, this.data.proposal?.pseudonymizedKey)
      .pipe(
        catchError(() => {
          this.alertService.showGeneralError(this.ERROR_REJECT_PROPOSAL_DIALOG);
          return EMPTY;
        }),
        switchMap(result =>
          this.proposalStateService.rejectProposal(
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
        next: () => {
          this.handleSuccess();
        },
      });
  }

  private handleSuccess(): void {
    this.toastService.show('proposal.reject.success');
    this.dialogRef.close(true);
  }

  protected dismissError() {
    this.alertService.clear(this.ERROR_REJECT_PROPOSAL_DIALOG);
  }

  ngOnDestroy() {
    this.clearAlertService();
  }

  clearAlertService() {
    this.alertService.resetActive();
    this.alertService.remove(this.ERROR_REJECT_PROPOSAL_DIALOG);
  }
}

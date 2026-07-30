import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CanApproveProposalPipe } from '@reuse/code/pipes/can-approve-proposal.pipe';
import { CanRejectProposalPipe } from '@reuse/code/pipes/can-reject-proposal.pipe';
import { DatePipe } from '@reuse/code/pipes/date.pipe';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { PrescriptionDetailsSecondaryService } from '../prescription-details-secondary/services/prescription-details-secondary.service';
import { ReadRequestResource } from '@reuse/code/openapi';
import { UserInfo } from '@reuse/code/interfaces';
import { ALERT_TARGET } from '@reuse/code/constants/error';

@Component({
  selector: 'app-prescription-details-bottom',
  imports: [CanApproveProposalPipe, CanRejectProposalPipe, DatePipe, MatButton, MatIcon, MatTooltip, TranslatePipe],
  templateUrl: './prescription-details-bottom.component.html',
  standalone: true,
  styleUrl: './prescription-details-bottom.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrescriptionDetailsBottomComponent {
  protected service = inject(PrescriptionDetailsSecondaryService);
  protected readonly alertTarget = inject(ALERT_TARGET);

  readonly prescriptionServiceData: ReadRequestResource | undefined = this.service.getPrescription().data;
  readonly currentUserServiceData: Partial<UserInfo> | undefined = this.service.getCurrentUser().data;
}

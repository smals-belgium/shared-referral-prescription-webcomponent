import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@reuse/code/pipes/date.pipe';
import { FormatNihdiPipe } from '@reuse/code/pipes/format-nihdi.pipe';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { NgStyle } from '@angular/common';
import { HideIfProfessionalDirective } from '@reuse/code/directives/hide-if-professional.directive';
import { ShowIfProfessionalDirective } from '@reuse/code/directives/show-if-professional.directive';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatFooterCell,
  MatFooterCellDef,
  MatFooterRow,
  MatFooterRowDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { MatChip } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProfessionalDisplayComponent } from '@reuse/code/components/professional-display/professional-display.component';
import { ReadRequestListResource, ReadRequestResource, RequestStatus } from '@reuse/code/openapi';

@Component({
  selector: 'app-prescriptions-table',
  templateUrl: './prescriptions-table.component.html',
  styleUrls: ['./prescriptions-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    DatePipe,
    FormatNihdiPipe,
    TemplateNamePipe,
    HideIfProfessionalDirective,
    ShowIfProfessionalDirective,
    NgStyle,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatChip,
    MatFooterCell,
    MatHeaderRow,
    MatRow,
    MatFooterRow,
    MatHeaderRowDef,
    MatRowDef,
    MatFooterCellDef,
    MatHeaderCellDef,
    MatCellDef,
    MatFooterRowDef,
    MatTooltipModule,
    ProfessionalDisplayComponent,
  ],
})
export class PrescriptionsTableComponent {
  @Input() prescriptions?: ReadRequestListResource;

  @Output() clickPrescription = new EventEmitter<ReadRequestResource>();

  displayedColumns: string[] = ['author', 'assigned', 'typeOfCare', 'start', 'end', 'status'];

  getStatusBorderColor(status: RequestStatus): string {
    if (
      status === RequestStatus.Blacklisted ||
      status === RequestStatus.Cancelled ||
      status === RequestStatus.Expired
    ) {
      return 'red';
    } else if (status === RequestStatus.Pending) {
      return 'orange';
    } else if (status === RequestStatus.InProgress) {
      return '#40c4ff';
    } else if (status === RequestStatus.Done) {
      return 'limegreen';
    } else {
      return 'lightgrey';
    }
  }
}

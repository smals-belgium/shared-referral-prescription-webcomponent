import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '../../pipes/date.pipe';
import { FormatNihdiPipe } from '../../pipes/format-nihdi.pipe';
import { TemplateNamePipe } from '../../pipes/template-name.pipe';
import { NgStyle } from '@angular/common';
import { HideIfProfessionalDirective } from '../../directives/hide-if-professional.directive';
import { ShowIfProfessionalDirective } from '../../directives/show-if-professional.directive';
import { PrescriptionSummary, PrescriptionSummaryList } from '../../interfaces/prescription-summary.interface';
import { Status } from '../../interfaces';
import {
  MatCell, MatCellDef,
  MatColumnDef,
  MatFooterCell, MatFooterCellDef, MatFooterRow, MatFooterRowDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef,
  MatRow, MatRowDef,
  MatTable
} from '@angular/material/table';
import { MatChip } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ProfessionalDisplayComponent
} from '@reuse/code/components/professional-display/professional-display.component';

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
        ProfessionalDisplayComponent
    ]
})
export class PrescriptionsTableComponent {

  @Input() prescriptions!: PrescriptionSummaryList;

  @Output() clickPrescription = new EventEmitter<PrescriptionSummary>();

  displayedColumns: string[] = ['author', 'assigned', 'typeOfCare', 'start', 'end', 'status']

  getStatusBorderColor(status: Status): string {
    if (status === 'BLACKLISTED' || status === 'CANCELLED'|| status === 'EXPIRED') {
      return 'red';
    } else if (status === 'PENDING') {
      return 'orange';
    } else if (status === 'IN_PROGRESS') {
      return '#40c4ff';
    } else if (status === 'DONE') {
      return 'limegreen';
    } else {
      return 'lightgrey';
    }
  }
}

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@reuse/code/pipes/date.pipe';
import { FormatNihdiPipe } from '@reuse/code/pipes/format-nihdi.pipe';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProfessionalDisplayComponent } from '@reuse/code/components/professional-display/professional-display.component';
import { ReadRequestListResource, ReadRequestResource, RequestStatus } from '@reuse/code/openapi';
import { FormatEnum, SkeletonComponent } from '@reuse/code/components/progress-indicators/skeleton/skeleton.component';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { HttpErrorResponse } from '@angular/common/http';
import { getStatusClassFromMap } from '@reuse/code/utils/utils';
import { AlertType } from '@reuse/code/interfaces';

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
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
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
    SkeletonComponent,
    AlertComponent,
  ],
})
export class PrescriptionsTableComponent {
  @Input() prescriptions?: ReadRequestListResource;
  get items() {
    return this.prescriptions?.items ?? [];
  }
  @Input() loading: boolean = false;
  @Output() clickPrescription = new EventEmitter<ReadRequestResource>();

  @Input() error: boolean = false;
  @Input() errorMsg: string = '';
  @Input() errorResponse?: HttpErrorResponse;
  @Output() retryOnError = new EventEmitter<void>();

  protected readonly FormatEnum = FormatEnum;
  protected readonly AlertType = AlertType;

  displayedColumns: string[] = ['creationDate', 'status', 'author', 'typeOfCare', 'start', 'end'];

  getStatusClass(status: RequestStatus): string {
    return getStatusClassFromMap(status);
  }
}

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@reuse/code/pipes/date.pipe';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ModelEntityDto, RequestStatus } from '@reuse/code/openapi';
import { FormatEnum, SkeletonComponent } from '@reuse/code/components/progress-indicators/skeleton/skeleton.component';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { AlertType } from '@reuse/code/interfaces';

@Component({
  selector: 'app-prescription-models-table',
  templateUrl: './prescription-models-table.component.html',
  styleUrls: ['./prescription-models-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    DatePipe,
    TemplateNamePipe,
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
    SkeletonComponent,
    AlertComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
})
export class PrescriptionModelsTableComponent {
  @Input() prescriptionModels?: ModelEntityDto[];
  @Input() page: number = 1;
  @Input() pageSize: number = 10;
  @Input() loading: boolean = false;

  @Output() openPrescriptionModel = new EventEmitter<ModelEntityDto>();
  @Output() deletePrescriptionModel = new EventEmitter<ModelEntityDto>();

  @Input() error: boolean = false;
  @Input() errorMsg: string = '';
  @Input() errorResponse?: HttpErrorResponse;
  @Output() retryOnError = new EventEmitter<void>();

  protected readonly FormatEnum = FormatEnum;
  protected readonly RequestStatus = RequestStatus;
  protected readonly AlertType = AlertType;

  displayedColumns: string[] = ['creationDate', 'label', 'template', 'actions'];

  @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger | undefined;

  onActionButtonClick = (event: Event, model: ModelEntityDto) => {
    event.stopPropagation();
    this.deletePrescriptionModel.emit(model);
    this.menuTrigger?.closeMenu();
  };
}

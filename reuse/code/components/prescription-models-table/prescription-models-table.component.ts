import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
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
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { PrescriptionModelService } from '@reuse/code/services/api/prescriptionModel.service';
import { ModelsState } from '@reuse/code/states/api/models.state';
import { ConfirmDialog } from '@reuse/code/dialogs/confirm/confirm.dialog';
import { MatDialog } from '@angular/material/dialog';
import { ModelEntityDto, RequestStatus } from '@reuse/code/openapi';

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
    MatButton,
    MatIcon,
  ],
})
export class PrescriptionModelsTableComponent {
  @Input() prescriptionModels?: ModelEntityDto[];
  @Input() page: number = 1;
  @Input() pageSize: number = 10;

  @Output() clickPrescriptionModel = new EventEmitter<ModelEntityDto>();

  displayedColumns: string[] = ['creationDate', 'label', 'template', 'actions'];

  constructor(
    private prescriptionModalService: PrescriptionModelService,
    private modelState: ModelsState,
    private dialog: MatDialog
  ) {}

  onActionButtonClick = (event: Event, model: ModelEntityDto) => {
    event.stopPropagation();

    this.dialog
      .open(ConfirmDialog, {
        data: {
          titleLabel: 'prescription.model.delete.title',
          messageLabel: 'prescription.model.delete.message',
          cancelLabel: 'common.cancel',
          okLabel: 'common.delete',
          params: {
            templateName: model.label,
          },
        },
      })
      .beforeClosed()
      .subscribe(accepted => {
        if (accepted === true && model.id) {
          this.prescriptionModalService.deleteModel(model.id).subscribe({
            next: () => {
              this.modelState.loadModels(this.page - 1, this.pageSize);
            },
          });
        }
      });
  };
  protected readonly RequestStatus = RequestStatus;
}

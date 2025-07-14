import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '../../pipes/date.pipe';
import { TemplateNamePipe } from '../../pipes/template-name.pipe';
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
  MatTable
} from '@angular/material/table';
import { PrescriptionModel } from '../../interfaces/prescription-modal.inteface';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { PrescriptionModelService } from '../../services/prescription-model.service';
import { ModelsState } from '../../states/models.state';
import { ConfirmDialog } from '../../dialogs/confirm/confirm.dialog';
import { MatDialog } from '@angular/material/dialog';

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
        MatIcon
    ]
})
export class PrescriptionModelsTableComponent {

  @Input() prescriptionModels!: PrescriptionModel[];
  @Input() page!: number;
  @Input() pageSize!: number;

  @Output() clickPrescriptionModel = new EventEmitter<PrescriptionModel>();

  displayedColumns: string[] = ['creationDate', 'label', 'template', 'actions'];

  constructor(private prescriptionModalService: PrescriptionModelService, private modelState: ModelsState, private dialog: MatDialog) {
  }

  onActionButtonClick = (event: Event, model: PrescriptionModel) => {
    event.stopPropagation();

    this.dialog.open(ConfirmDialog, {
      data: {
        titleLabel: 'prescription.model.delete.title',
        messageLabel: 'prescription.model.delete.message',
        cancelLabel: 'common.cancel',
        okLabel: 'common.delete',
        params: {
          templateName: model.label
        }
      }
    })
      .beforeClosed()
      .subscribe((accepted) => {
        if (accepted === true) {
          this.prescriptionModalService.deleteModel(model.id).subscribe({
            next: () => {
              this.modelState.loadModels(this.page - 1, this.pageSize)
            }
          })
        }
      });
  }

}

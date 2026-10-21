import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  input,
  Input,
  output,
  Output,
  ViewChild,
} from '@angular/core';
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
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { AlertType } from '@reuse/code/interfaces';
import { ResolvedError } from '@reuse/code/interfaces/error.interface';

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
    MatHeaderRow,
    MatRow,
    MatHeaderRowDef,
    MatRowDef,
    MatHeaderCellDef,
    MatCellDef,
    SkeletonComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFooterCell,
    MatFooterRow,
    MatFooterRowDef,
    MatFooterCellDef,
  ],
})
export class PrescriptionModelsTableComponent {
  // Input properties
  readonly loading = input<boolean>(false);
  readonly prescriptionModels = input<ModelEntityDto[] | undefined>(undefined);
  readonly pageSize = input<number>(10);
  readonly page = input<number>(1);

  // Output events
  openPrescriptionModel = output<ModelEntityDto>();
  deletePrescriptionModel = output<ModelEntityDto>();

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

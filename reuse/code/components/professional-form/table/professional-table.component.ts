import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormatNihdiPipe } from '@reuse/code/pipes/format-nihdi.pipe';
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
import { FormatEnum, SkeletonComponent } from '@reuse/code/components/progress-indicators/skeleton/skeleton.component';
import { TranslatePipe } from '@ngx-translate/core';
import { FormatMultilingualObjectPipe } from '@reuse/code/pipes/format-multilingual-object.pipe';
import { HealthcareProResource, Translation } from '@reuse/code/openapi';
import { MatIconModule } from '@angular/material/icon';
import { AlertType } from '@reuse/code/interfaces';
import { MatButtonModule } from '@angular/material/button';
import { PaginatorComponent } from '@reuse/code/components/paginator/paginator.component';
import { HighlightFilterPipe } from '@reuse/code/pipes/highlight-filter.pipe';

export type TranslationType = keyof Translation;

@Component({
  selector: 'professional-table',
  imports: [
    FormatNihdiPipe,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatFooterCell,
    MatFooterRow,
    MatFooterRowDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatTable,
    SkeletonComponent,
    FormatMultilingualObjectPipe,
    MatIconModule,
    MatHeaderCellDef,
    MatFooterCellDef,
    TranslatePipe,
    MatButtonModule,
    HighlightFilterPipe,
    PaginatorComponent,
  ],
  templateUrl: './professional-table.component.html',
  styleUrl: './professional-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalTableComponent {
  protected readonly displayedColumns: string[] = ['icon', 'lastname', 'firstname', 'address', 'city', 'actions'];
  protected readonly AlertType = AlertType;
  protected readonly FormatEnum = FormatEnum;

  readonly requestData = input<HealthcareProResource[]>([]);
  readonly total = input<number | undefined>(undefined);
  readonly page = input<number>(0);
  readonly pageSize = input<number>(0);
  readonly query = input<string>('');
  readonly loading = input<boolean>(false);
  readonly currentLang = input.required<TranslationType | undefined>();

  readonly selectProfessional = output<HealthcareProResource>();

  readonly changePage = output<{ pageIndex?: number; pageSize?: number }>();
}

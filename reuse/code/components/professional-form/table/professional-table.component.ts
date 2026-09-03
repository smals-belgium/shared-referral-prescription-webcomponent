import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
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
import { TranslatePipe } from '@ngx-translate/core';
import { PaginatorComponent } from '@reuse/code/components/paginator/paginator.component';
import { FormatEnum, SkeletonComponent } from '@reuse/code/components/progress-indicators/skeleton/skeleton.component';
import { AlertType } from '@reuse/code/interfaces';
import { HealthCareProviderResource, ProviderType, Translation } from '@reuse/code/openapi';
import { FormatMultilingualObjectPipe } from '@reuse/code/pipes/format-multilingual-object.pipe';
import { FormatNihdiPipe } from '@reuse/code/pipes/format-nihdi.pipe';
import { HighlightFilterPipe } from '@reuse/code/pipes/highlight-filter.pipe';
import { isProfessional } from '@reuse/code/utils/assignment-disciplines.utils';

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
    MatSelectModule,
  ],
  templateUrl: './professional-table.component.html',
  styleUrl: './professional-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalTableComponent {
  protected readonly displayedColumns: string[] = ['icon', 'lastname', 'firstname', 'address', 'city', 'actions'];
  protected readonly filterColumns: string[] = [
    'iconFilter',
    'lastnameFilter',
    'firstnameFilter',
    'addressFilter',
    'cityFilter',
    'actionsFilter',
  ];
  protected readonly AlertType = AlertType;
  protected readonly FormatEnum = FormatEnum;
  protected readonly isProfessional = isProfessional;

  readonly requestData = input<HealthCareProviderResource[]>([]);
  readonly total = input<number | undefined>(undefined);
  readonly page = input<number>(0);
  readonly pageSize = input<number>(0);
  readonly query = input<string>('');
  readonly loading = input<boolean>(false);
  readonly currentLang = input.required<TranslationType | undefined>();
  readonly providerTypeOptions = input.required<ProviderType[]>();
  selectedType = model.required<ProviderType>();

  readonly selectProfessional = output<HealthCareProviderResource>();

  readonly changePage = output<{ pageIndex?: number; pageSize?: number }>();
}

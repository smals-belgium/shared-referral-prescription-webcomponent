import { Component, inject, input, OnChanges, OnDestroy, output, SimpleChanges } from '@angular/core';
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
import { HealthcareOrganizationResource, HealthcareProResource, ProviderType, Translation } from '@reuse/code/openapi';
import { MatIconModule } from '@angular/material/icon';
import { AlertType, Intent, SearchProfessionalCriteria } from '@reuse/code/interfaces';
import { MatButtonModule } from '@angular/material/button';
import { getAssignableProfessionalDisciplines } from '@reuse/code/utils/assignment-disciplines.utils';
import { RequestProfessionalDataService } from '@reuse/code/services/helpers/request-professional-data.service';

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
  ],
  templateUrl: './professional-table.component.html',
  styleUrl: './professional-table.component.scss',
})
export class ProfessionalTableComponent implements OnChanges, OnDestroy {
  protected readonly displayedColumns: string[] = ['icon', 'lastname', 'firstname', 'address', 'city', 'actions'];
  protected readonly AlertType = AlertType;
  protected readonly FormatEnum = FormatEnum;
  private readonly _dataService = inject(RequestProfessionalDataService);

  readonly professionals = input<(HealthcareProResource | HealthcareOrganizationResource)[]>([]);
  readonly total = input<number | undefined>(undefined);
  readonly loading = input<boolean>(false);
  readonly currentLang = input.required<TranslationType | undefined>();
  readonly category = input.required<string>();
  readonly intent = input.required<Intent>();
  readonly query = input<string>('');
  readonly zipCodes = input<number[]>([]);
  readonly prescriptionId = input.required<string>();

  // Public signals from service
  readonly requestData = this._dataService.data;

  readonly selectProfessional = output<HealthcareProResource | HealthcareOrganizationResource>();

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['professionals']) return;

    if (this.professionals()?.length) {
      this.initializeDataStream();
    } else {
      this._dataService.reset();
    }
  }

  private initializeDataStream(): void {
    const initialData = this.professionals() ?? [];
    const disciplines: string[] = getAssignableProfessionalDisciplines(this.category(), this.intent());
    const config: SearchProfessionalCriteria = {
      query: this.query(),
      zipCodes: this.zipCodes(),
      disciplines,
      institutionTypes: [],
      providerType: ProviderType.Professional,
      prescriptionId: this.prescriptionId(),
      intent: this.intent(),
    };

    this._dataService.initializeTableDataStream({ data: initialData, total: this.total() ?? -1 }, config);
  }

  ngOnDestroy() {
    this._dataService.reset();
  }
}

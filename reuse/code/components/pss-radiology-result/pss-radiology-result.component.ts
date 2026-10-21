import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ContentChild,
  inject,
  input,
  OnChanges,
  output,
  signal,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { FormatEnum, SkeletonComponent } from '@reuse/code/components/progress-indicators/skeleton/skeleton.component';
import { PssRadiationRateComponent } from '@reuse/code/components/pss-radiation-rate/pss-radiation-rate.component';
import { PssScoreBarComponent } from '@reuse/code/components/pss-score-bar/pss-score-bar.component';
import { PSS_OTHER_REASON, PSS_SUCCESS_SCORE, PSS_ZERO_SCORE } from '@reuse/code/constants/pss.constants';
import { SupportOption } from '@reuse/code/openapi';
import { getTranslationFromSupportOptionMetadata } from '@reuse/code/utils/pss-translations-from-support-option-metadata.utils';
import { AutocompleteOption, EvfTranslateService } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

@Component({
  selector: 'app-pss-radiology-result',
  templateUrl: './pss-radiology-result.component.html',
  styleUrls: ['./pss-radiology-result.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    TranslateModule,
    MatTableModule,
    MatCheckbox,
    SkeletonComponent,
    PssScoreBarComponent,
    PssRadiationRateComponent,
  ],
})
export class PssRadiologyResultComponent implements OnChanges {
  protected readonly PSS_OTHER_REASON = PSS_OTHER_REASON;
  protected readonly FormatEnum = FormatEnum;

  private readonly evfTranslate = inject(EvfTranslateService);
  protected currentLang = toSignal(this.evfTranslate.currentLang$, {
    initialValue: this.evfTranslate.currentLang,
  });
  protected selectedRow = signal<SupportOption | undefined>(undefined);

  dataSource = new MatTableDataSource<SupportOption>([]);

  supportOptions = input<SupportOption[]>();
  prescribedExam = input<AutocompleteOption[]>();
  isLoading = input<boolean>(true);
  hasProposedImaging = input<boolean>(true);
  selectSupportOption = output<SupportOption>();

  readonly shouldAutoExpand = computed(() => {
    const row = this.selectedRow();
    return !row?.score || (row.score < PSS_SUCCESS_SCORE && row.score >= PSS_ZERO_SCORE);
  });

  protected displayedColumns: string[] = ['select', 'relevance', 'typesOfImagery', 'radiationRate'];
  protected displayedColumnsNoScore = ['select', 'noScore'];
  protected hasScore = (index: number, row: SupportOption) => (row.score && row.score > PSS_ZERO_SCORE) || false;
  protected hasNoScore = (index: number, row: SupportOption) =>
    (row.score != null && row.score <= PSS_ZERO_SCORE) || false;

  @ContentChild(TemplateRef) detailTemplate?: TemplateRef<{ $implicit: SupportOption }>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['supportOptions'] || changes['prescribedExam']) {
      const pescribedExam = this.prescribedExam();
      const supportOptions = this.supportOptions();
      if (pescribedExam && supportOptions) {
        const supportOption = this.findSupportOptionById(supportOptions, pescribedExam);
        if (supportOption) {
          this.selectedRow.set(supportOption);
          this.selectSupportOption.emit(supportOption);
        }
      }

      if (supportOptions) {
        this.dataSource.data = supportOptions;
      }
    }
  }

  toggle(supportOption: SupportOption) {
    if (!this.hasProposedImaging() && supportOption.id === PSS_OTHER_REASON) return;
    this.selectedRow.set(supportOption);
    this.selectSupportOption.emit(supportOption);
  }

  isSelected(supportOption: SupportOption) {
    return supportOption.id === this.selectedRow()?.id;
  }

  getTranslation(supportOption: SupportOption) {
    return getTranslationFromSupportOptionMetadata(supportOption, this.currentLang(), this.evfTranslate);
  }

  private findSupportOptionById(
    options: SupportOption[],
    prescribedExam: AutocompleteOption[]
  ): SupportOption | undefined {
    const idsToFind = new Set(prescribedExam.map(exam => exam.value as string));
    return options.find(option => idsToFind.has(option.id as string));
  }
}

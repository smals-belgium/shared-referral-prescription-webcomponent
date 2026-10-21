import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormatSsinPipe } from '@reuse/code/pipes/format-ssin.pipe';
import { PersonResource } from '@reuse/code/openapi';

@Component({
  selector: 'app-patient-info-bar',
  templateUrl: './patient-info-bar.component.html',
  styleUrls: ['./patient-info-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormatSsinPipe, TranslateModule],
})
export class PatientInfoBarComponent {
  @Input({ required: true }) patient!: PersonResource;
}

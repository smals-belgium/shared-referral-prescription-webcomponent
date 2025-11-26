import { Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { FormatSsinPipe } from '@reuse/code/pipes/format-ssin.pipe';
import { PersonResource, ReadRequestResource } from '@reuse/code/openapi';

@Component({
  selector: 'app-prescription-details-beneficiary',
  standalone: true,
  imports: [
    TranslatePipe,
    FormatSsinPipe
  ],
  templateUrl: './prescription-details-beneficiary.component.html',
  styleUrl: './prescription-details-beneficiary.component.scss'
})
export class PrescriptionDetailsBeneficiaryComponent {

  @Input() patient?: PersonResource;
  @Input() prescription?: ReadRequestResource;

}

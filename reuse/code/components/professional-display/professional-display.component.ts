import { Component, Input } from '@angular/core';
import { UserInfo } from '@reuse/code/interfaces';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HealthcareProResource } from '@reuse/code/openapi';

@Component({
  selector: 'app-professional-display',
  templateUrl: './professional-display.component.html',
  imports: [TranslateModule, MatIconModule, MatTooltipModule],
})
export class ProfessionalDisplayComponent {
  @Input() professional?: HealthcareProResource;
  @Input() currentUser?: Partial<UserInfo>;

  get isCurrentUser(): boolean {
    return this.professional?.id?.ssin === this.currentUser?.ssin;
  }

  get hasName(): boolean {
    return !!this.professional?.healthcarePerson?.lastName;
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-toggle-historic-prescriptions',
  imports: [MatSlideToggleModule, TranslateModule, FormsModule],
  templateUrl: './toggle-historic-prescriptions.component.html',
  standalone: true,
})
export class ToggleHistoricPrescriptionsComponent {
  @Input() isChecked: boolean = false;
  @Output() toggleChanged = new EventEmitter<boolean>();

  onToggleChange(event: any) {
    this.toggleChanged.emit(event.checked);
  }
}

import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-toggle-historic-prescriptions',
  standalone: true,
  imports: [MatSlideToggleModule, TranslateModule, FormsModule],
  templateUrl: './toggle-historic-prescriptions.component.html',
  styleUrl: './toggle-historic-prescriptions.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom
})
export class ToggleHistoricPrescriptionsComponent {
  @Input() isChecked: boolean = false;
  @Output() toggleChanged = new EventEmitter<boolean>();

  onToggleChange(event: any) {
    this.toggleChanged.emit(event.checked);
  }
}

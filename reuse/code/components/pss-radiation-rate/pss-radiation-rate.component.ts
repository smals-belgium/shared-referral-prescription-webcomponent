import { Component, computed, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pss-radiation-rate',
  templateUrl: './pss-radiation-rate.component.html',
  styleUrls: ['./pss-radiation-rate.component.scss'],
  imports: [MatIcon, TranslateModule],
})
export class PssRadiationRateComponent {
  readonly level = input.required<number>();
  readonly maxLevel = input<number>(5);

  // one array entry per icon to render, active up to the current level
  protected readonly levels = computed(() => new Array(this.maxLevel()));
}

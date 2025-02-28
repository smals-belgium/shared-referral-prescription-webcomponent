import {
  ChangeDetectionStrategy,
  Component,
  Input
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatCard, MatCardContent } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'app-success-card',
  templateUrl: './success-card.component.html',
  styleUrls: ['./success-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    MatCard,
    MatCardContent
  ]
})
export class SuccessCardComponent {
  @Input() message?: string;
}

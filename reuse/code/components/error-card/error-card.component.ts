import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { MatCard, MatCardActions, MatCardContent, MatCardTitle } from '@angular/material/card';

@Component({
    selector: 'app-error-card',
    templateUrl: './error-card.component.html',
    styleUrls: ['./error-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        TranslateModule,
        MatIconModule,
        MatButtonModule,
        MatCard,
        MatCardContent,
        MatCardActions,
        MatCardTitle
    ]
})
export class ErrorCardComponent implements OnChanges {

  readonly genericErrors: Record<number, string> = {403: 'common.forbiddenResource', 404: 'common.notFoundResource'};
  genericErrorMsgKey?: string;

  @Input() title?: string;
  @Input() message?: string;
  @Input() showRetry = true;
  @Input() error?: HttpErrorResponse;

  @Output() clickRetry = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges) {
    if(changes['error']) {
      this.setGenericErrorMsgKey()
    }
  }

  private setGenericErrorMsgKey(): void {
    this.genericErrorMsgKey = this.error ? this.genericErrors[this.error.status] : undefined;
  }
}

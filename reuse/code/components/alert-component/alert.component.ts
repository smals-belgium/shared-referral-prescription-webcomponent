import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { AlertComponent as MhAlertComponent } from '@myhealth-belgium/myhealth-additional-ui-components';
import { AlertType } from '@reuse/code/interfaces';

@Component({
  selector: 'app-alert',
  styleUrls: ['./alert.component.scss'],
  templateUrl: './alert.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, MhAlertComponent],
})
export class AlertComponent implements OnChanges {
  readonly genericErrors: Record<number, string> = { 403: 'common.forbiddenResource', 404: 'common.notFoundResource' };
  genericErrorMsgKey?: string;

  @Input() alert: AlertType = AlertType.Error;
  @Input() title: string = '';
  @Input() message?: string;
  @Input() showRetry = true;
  @Input() error?: HttpErrorResponse;

  @Output() clickRetry = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['error']) {
      this.setGenericErrorMsgKey();
    }
  }

  private setGenericErrorMsgKey(): void {
    this.genericErrorMsgKey = this.error ? this.genericErrors[this.error.status] : undefined;
  }
}

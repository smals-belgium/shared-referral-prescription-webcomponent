import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  model,
  OnChanges,
  output,
  signal,
  SimpleChanges,
  WritableSignal,
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
  genericErrorMsgKey?: string;

  alert = model<AlertType>(AlertType.Error);
  title = model<string>('');
  subTitle = model<string>('');
  message = input<string | undefined>();
  showRetry = model<boolean>(true);
  error = input<HttpErrorResponse | undefined>();

  clickRetry = output<void>();

  readonly contentRef = contentChild('content');
  readonly hasContent = computed(() => !!this.contentRef());

  showBody: WritableSignal<boolean> = signal(false);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['error'] || changes['message']) {
      this.setGenericErrorMsgKey();
    }
  }

  private setGenericErrorMsgKey(): void {
    if (this.error?.() && !this.message?.()?.length) {
      this.title.set('common.error.default.header');
      this.subTitle.set('common.error.default.subheader');
      this.alert.set(AlertType.Warning);
      this.showRetry.set(false);
      this.showBody.set(false);
    } else {
      this.genericErrorMsgKey = undefined;
      this.showBody.set(true);
    }
  }
}

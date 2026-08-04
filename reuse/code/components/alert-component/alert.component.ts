import { ChangeDetectionStrategy, Component, computed, contentChild, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AlertComponent as MhAlertComponent } from '@myhealth-belgium/myhealth-additional-ui-components';
import { ResolvedError } from '@reuse/code/interfaces/error.interface';
import { AlertType } from '@reuse/code/interfaces';

export const defaultError: ResolvedError = {
  title: 'common.somethingWentWrong',
  message: undefined,
  severity: AlertType.Error,
  dismissible: true,
  retry: false,
};

type MessageInput = string | { value: string; isTranslated: boolean };

@Component({
  selector: 'app-alert',
  styleUrls: ['./alert.component.scss'],
  templateUrl: './alert.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, MhAlertComponent],
})
export class AlertComponent {
  severity = input<AlertType>(AlertType.Error);
  title = input<string | undefined>('');
  subTitle = input<string | undefined>('');
  errorId = input<string | undefined>();
  dismissible = input<boolean>(true);
  retry = input<boolean>(true);

  message = input<MessageInput | undefined>();

  protected readonly resolvedMessage = computed(() => {
    const messageInput = this.message();
    if (messageInput == null) return null;
    return typeof messageInput === 'string' ? { value: messageInput, isTranslated: false } : messageInput;
  });

  protected readonly dismissMode = computed(() => (this.dismissible() ? 'closable' : 'pinned'));
  readonly contentRef = contentChild('content');
  readonly hasContent = computed(() => !!this.contentRef());

  clickRetry = output<void>();
  clickClose = output<void>();
}

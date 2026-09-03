import { Component, contentChild, ElementRef, input, output } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-dialog-layout',
  templateUrl: './dialog-layout.component.html',
  styleUrls: ['./dialog-layout.component.scss'],
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslatePipe],
})
export class DialogLayoutComponent {
  title = input.required<string>();
  requiredSubTitle = input<boolean>(false);

  confirmText = input<string>('common.confirm');
  cancelText = input<string>('common.cancel');
  confirmDisabled = input<boolean>(false);
  cancelData = input<unknown>();

  // Outputs to handle actions in the parent
  confirm = output<void>();

  // Detect if the user passed an override template/elements
  overrideActions = contentChild<ElementRef>('overrideActions');

  get hasOverride(): boolean {
    return !!this.overrideActions();
  }

  onConfirm(): void {
    this.confirm.emit();
  }
}

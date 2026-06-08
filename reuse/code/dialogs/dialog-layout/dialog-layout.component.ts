import { Component, input } from '@angular/core';
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
  requiredSubTitle = input<boolean>();
}

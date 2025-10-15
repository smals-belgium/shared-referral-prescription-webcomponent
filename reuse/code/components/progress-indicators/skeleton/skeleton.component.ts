import { Component, input, InputSignal } from '@angular/core';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { MatCard, MatCardContent } from '@angular/material/card';

export enum FormatEnum {
  LINE = 'LINE',
  CARD = 'CARD',
}

@Component({
  selector: 'app-skeleton',
  templateUrl: './skeleton.component.html',
  styleUrls: ['./skeleton.component.scss'],
  imports: [NgxSkeletonLoaderComponent, MatCardContent, MatCard],
})
export class SkeletonComponent {
  readonly items: InputSignal<number> = input.required();
  readonly format: InputSignal<FormatEnum> = input.required();
  protected readonly FormatEnum = FormatEnum;

  get skeletons() {
    return Array.from({ length: this.items() });
  }

  private readonly cardThemeDefaults = {
    'border-radius': '0',
    height: '15px',
    'margin-bottom': '10px',
  };

  protected readonly cardThemeLine1 = {
    width: '200px',
    ...this.cardThemeDefaults,
  };

  protected readonly cardThemeLine2 = {
    width: '170px',
    ...this.cardThemeDefaults,
  };

  protected readonly cardThemeLine3 = {
    width: '80%',
    ...this.cardThemeDefaults,
  };

  protected readonly cardThemeLine4 = {
    width: '90%',
    ...this.cardThemeDefaults,
  };

  protected readonly cardThemeLine5 = {
    width: '60%',
    ...this.cardThemeDefaults,
  };
}

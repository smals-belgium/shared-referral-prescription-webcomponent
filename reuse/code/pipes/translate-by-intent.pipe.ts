import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Intent } from '@reuse/code/interfaces';

@Pipe({ name: 'translateByIntent' })
export class TranslateByIntentPipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(
    intent: string,
    keys: { order: string; proposal: string; model?: string; default?: string },
    params?: Record<string, any>
  ): string {
    switch (intent.toLowerCase()){
      case Intent.ORDER:
        return this.translate.instant(keys.order, params);
      case Intent.PROPOSAL:
        return this.translate.instant(keys.proposal, params);
      case Intent.MODEL:
        if(keys.model != undefined){
          return this.translate.instant(keys.model, params);
        }
        return this.translate.instant(keys.order, params);
      default:
        if(keys.default != undefined){
          return this.translate.instant(keys.default, params);
        }
        return this.translate.instant(keys.order, params);
    }
  }
}

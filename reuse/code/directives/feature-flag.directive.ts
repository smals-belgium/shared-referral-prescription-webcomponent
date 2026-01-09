import { Directive, inject, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { FeatureFlagKeys } from '@reuse/app.config';
import { FeatureFlagService } from '../services/helpers/feature-flag.service';

@Directive({ selector: '[featureFlag]', standalone: true })
export class FeatureFlagDirective {
  templateRef = inject(TemplateRef);
  viewContainer = inject(ViewContainerRef);
  featureFlagService = inject(FeatureFlagService);

  private elseTemplateRef: TemplateRef<unknown> | null = null;

  @Input() set featureFlag(feature: FeatureFlagKeys) {
    this.viewContainer.clear();

    if (this.featureFlagService.getFeature(feature)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else if (this.elseTemplateRef) {
      this.viewContainer.createEmbeddedView(this.elseTemplateRef);
    }
  }

  @Input() set featureFlagElse(elseTemplateRef: TemplateRef<unknown>) {
    this.elseTemplateRef = elseTemplateRef;
  }
}

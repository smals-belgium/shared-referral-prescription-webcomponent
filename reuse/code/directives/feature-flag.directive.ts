import { computed, Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { FeatureFlag } from '@reuse/app.config';
import { FeatureFlagService } from '../services/helpers/feature-flag.service';

@Directive({ selector: '[featureFlag]', standalone: true })
export class FeatureFlagDirective {
  featureFlag = input.required<FeatureFlag>();
  featureFlagElse = input<TemplateRef<unknown> | null>(null);

  private readonly featureFlagService = inject(FeatureFlagService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  private readonly featureFlagValue = computed(() => this.featureFlagService.getFeature(this.featureFlag())());

  private readonly syncViewWithFeatureFlagEffect = effect(() => {
    const elseTemplate = this.featureFlagElse();

    this.viewContainer.clear();

    if (this.featureFlagValue()) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else if (elseTemplate) {
      this.viewContainer.createEmbeddedView(elseTemplate);
    }
  });
}

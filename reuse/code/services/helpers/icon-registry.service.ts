import { inject, Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { MATERIAL_ICONS, SupportedMaterialIcons } from '@reuse/code/constants/icons';

@Injectable({
  providedIn: 'root',
})
export class IconRegistryService {
  private readonly iconRegistry = inject(MatIconRegistry);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly registered = new Set<SupportedMaterialIcons>();

  init(...icons: SupportedMaterialIcons[]) {
    icons.forEach(name => {
      if (this.registered.has(name)) {
        return;
      }

      const svg = MATERIAL_ICONS[name];

      if (!svg) {
        console.warn(`Icon "${name}" not found in ICON_MAP`);
        return;
      }

      this.iconRegistry.addSvgIconLiteral(name, this.sanitizer.bypassSecurityTrustHtml(svg));

      this.registered.add(name);
    });
  }
}

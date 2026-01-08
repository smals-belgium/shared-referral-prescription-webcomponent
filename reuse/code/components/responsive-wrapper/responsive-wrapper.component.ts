import { Component, ContentChild, inject, TemplateRef } from '@angular/core';
import { DeviceService } from '@reuse/code/services/helpers/device.service';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-responsive-wrapper',
  templateUrl: './responsive-wrapper.component.html',
  imports: [NgTemplateOutlet],
})
export class ResponsiveWrapperComponent {
  private readonly deviceService = inject(DeviceService);
  protected readonly isDesktop = this.deviceService.isDesktop;

  @ContentChild('desktopTemplate') desktopTemplate!: TemplateRef<any>;
  @ContentChild('mobileTemplate') mobileTemplate!: TemplateRef<any>;
}

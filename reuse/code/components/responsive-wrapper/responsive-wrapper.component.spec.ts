import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ResponsiveWrapperComponent } from './responsive-wrapper.component';
import { DeviceService } from '@reuse/code/services/helpers/device.service';

class MockDeviceService {
  isDesktop = signal(true);
}

// Host component with different templates for desktop and mobile
@Component({
  template: `
    <app-responsive-wrapper>
      <ng-template #desktopTemplate>
        <div class="desktop-content">Desktop View</div>
      </ng-template>
      <ng-template #mobileTemplate>
        <div class="mobile-content">Mobile View</div>
      </ng-template>
    </app-responsive-wrapper>
  `,
  imports: [ResponsiveWrapperComponent],
})
class TestHostComponent {}

describe('ResponsiveWrapperComponent', () => {
  let component: ResponsiveWrapperComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let mockDeviceService: MockDeviceService;

  beforeEach(async () => {
    mockDeviceService = new MockDeviceService();

    await TestBed.configureTestingModule({
      imports: [ResponsiveWrapperComponent, TestHostComponent],
      providers: [{ provide: DeviceService, useValue: mockDeviceService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  });

  it('should create component and inject DeviceService', () => {
    expect(component).toBeTruthy();
    expect((component as any).isDesktop).toBeTruthy();
    expect((component as any).isDesktop()).toBe(true);
  });

  it('should render desktop template when isDesktop is true', () => {
    mockDeviceService.isDesktop.set(true);
    fixture.detectChanges();

    const desktopContent = fixture.nativeElement.querySelector('.desktop-content');
    const mobileContent = fixture.nativeElement.querySelector('.mobile-content');

    expect(desktopContent).toBeTruthy();
    expect(desktopContent.textContent).toBe('Desktop View');
    expect(mobileContent).toBeFalsy();
  });

  it('should render mobile template when isDesktop is false', () => {
    mockDeviceService.isDesktop.set(false);
    fixture.detectChanges();

    const desktopContent = fixture.nativeElement.querySelector('.desktop-content');
    const mobileContent = fixture.nativeElement.querySelector('.mobile-content');

    expect(mobileContent).toBeTruthy();
    expect(mobileContent.textContent).toBe('Mobile View');
    expect(desktopContent).toBeFalsy();
  });

  it('should switch templates when device type changes', () => {
    // Start with desktop
    mockDeviceService.isDesktop.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.desktop-content')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.mobile-content')).toBeFalsy();

    // Switch to mobile
    mockDeviceService.isDesktop.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.mobile-content')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.desktop-content')).toBeFalsy();

    // Switch back to desktop
    mockDeviceService.isDesktop.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.desktop-content')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.mobile-content')).toBeFalsy();
  });
});

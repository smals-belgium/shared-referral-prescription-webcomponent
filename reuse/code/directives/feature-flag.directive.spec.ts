import { Component, signal, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureFlagDirective } from './feature-flag.directive';
import { FeatureFlagService } from '../services/helpers/feature-flag.service';
import { FeatureFlag } from '@reuse/app.config';

const mockFeatureFlagService: Partial<jest.Mocked<FeatureFlagService>> = {
  getFeature: jest.fn(),
};

@Component({
  standalone: true,
  imports: [FeatureFlagDirective],
  template: `
    <ng-template #elseTpl><span>Else content</span></ng-template>
    <ng-template [featureFlagElse]="elseTpl" [featureFlag]="currentFeature">
      <span>Feature content</span>
    </ng-template>
  `,
})
class HostComponent {
  @ViewChild('elseTpl', { static: true }) elseTpl!: TemplateRef<unknown>;
  currentFeature: FeatureFlag = 'ui-filters';
}

describe('FeatureFlagDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let featureFlagService: jest.Mocked<FeatureFlagService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: FeatureFlagService, useValue: mockFeatureFlagService }],
    });

    fixture = TestBed.createComponent(HostComponent);
    featureFlagService = TestBed.inject(FeatureFlagService) as jest.Mocked<FeatureFlagService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the main template when feature is enabled', () => {
    featureFlagService.getFeature.mockReturnValue(signal(true));
    fixture.detectChanges();

    const hostEl = fixture.nativeElement as HTMLElement;
    expect(hostEl.textContent).toContain('Feature content');
    expect(featureFlagService.getFeature).toHaveBeenCalledWith('ui-filters');
  });

  it('renders else template when feature flag is false', () => {
    featureFlagService.getFeature.mockReturnValue(signal(false));
    fixture.detectChanges();

    const hostEl = fixture.nativeElement as HTMLElement;
    expect(hostEl.textContent).toContain('Else content');
    expect(hostEl.textContent).not.toContain('Feature content');
    expect(featureFlagService.getFeature).toHaveBeenCalledWith('ui-filters');
  });
});

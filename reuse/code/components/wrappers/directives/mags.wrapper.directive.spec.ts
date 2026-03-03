import { Component, ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MagsComponent } from './mags.wrapper.directive';
import { HOST_SERVICES } from '../injection-tokens/host-services.injection-token';
import { HOST_SETTINGS } from '../injection-tokens/host-settings.injection-token';

@Component({ selector: 'test-mags', template: '' })
class TestMagsComponent extends MagsComponent {
  public override initWebComponent = jest.fn();
  public override onSettingsChanged = jest.fn();
  public override onVersionMissmatch = jest.fn();
}

describe('MagsComponent', () => {
  let component: TestMagsComponent;
  let mockHostServices: {
    getAccessToken: jest.Mock;
    getIdToken: jest.Mock;
    events: { addEventListener: jest.Mock };
  };
  let mockHostSettings: { configName: string };
  let mockElementRef: { nativeElement: HTMLElement };

  beforeEach(() => {
    mockHostServices = {
      getAccessToken: jest.fn().mockResolvedValue('real-token'),
      getIdToken: jest.fn().mockResolvedValue('jwt-token'),
      events: { addEventListener: jest.fn() },
    };
    mockHostSettings = { configName: 'dev' };
    mockElementRef = { nativeElement: document.createElement('div') };

    TestBed.configureTestingModule({
      imports: [TestMagsComponent],
      providers: [
        { provide: HOST_SERVICES, useValue: mockHostServices },
        { provide: HOST_SETTINGS, useValue: mockHostSettings },
        { provide: ElementRef, useValue: mockElementRef },
      ],
    });

    component = TestBed.createComponent(TestMagsComponent).componentInstance;
  });

  afterEach(() => {
    delete (window as any).referralPrescriptionEnv;
  });

  it('should return demo idToken when configName is demo', async () => {
    mockHostSettings.configName = 'demo';
    const token = await component['getIdToken']();
    expect(token).toEqual({
      userProfile: {
        ssin: '80222700153',
        firstName: 'John',
        lastName: 'Doe',
        gender: 'M',
      },
    });
  });

  it('should call hostServices.getAccessToken for non-demo configs', async () => {
    mockHostSettings.configName = 'dev';
    await component['getIdToken']();
    expect(mockHostServices.getIdToken).toHaveBeenCalled();
  });
});

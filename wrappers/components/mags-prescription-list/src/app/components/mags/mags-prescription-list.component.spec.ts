import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MagsPrescriptionList } from './mags-prescription-list.component';
import { hasUserProfile } from '@reuse/code/utils/mags-utils';
import { HOST_SERVICES } from '@reuse/code/components/wrappers/injection-tokens/host-services.injection-token';
import { HOST_SETTINGS } from '@reuse/code/components/wrappers/injection-tokens/host-settings.injection-token';
import { wrapperManifest } from '../../../../manifest';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Lang } from '@reuse/code/constants/languages';
import { Intent } from '@reuse/code/interfaces';
import { UserLanguage } from '@smals-belgium/myhealth-wc-integration';

jest.mock('@reuse/code/utils/mags-utils', () => ({
  hasUserProfile: jest.fn(),
}));

describe('MagsPrescriptionList', () => {
  let component: MagsPrescriptionList;
  let fixture: ComponentFixture<MagsPrescriptionList>;
  let mockWebComponent: any;
  let mockHostServices: any;
  let mockHostSettings: any;

  beforeEach(async () => {
    mockWebComponent = {
      intent: null,
      lang: Lang.NL.full,
      services: undefined as any,
      setAttribute: jest.fn(),
      addEventListener: jest.fn(),
      getAttribute: jest.fn().mockReturnValue(Lang.NL.full),
    };

    (hasUserProfile as unknown as jest.Mock).mockReturnValue(true);

    mockHostServices = {
      getAccessToken: jest.fn().mockResolvedValue('access-token'),
      getIdToken: jest.fn().mockResolvedValue({ userProfile: { ssin: '12345' } }),
    };

    mockHostSettings = {
      language: UserLanguage.EN,
    };

    await TestBed.configureTestingModule({
      imports: [MagsPrescriptionList, TranslateModule.forRoot({})],
      providers: [
        { provide: HOST_SERVICES, useValue: mockHostServices },
        { provide: HOST_SETTINGS, useValue: mockHostSettings },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MagsPrescriptionList);
    component = fixture.componentInstance;

    // mocks for MagsComponent
    const componentAny = component as any;

    componentAny.getAccessToken = jest.fn().mockResolvedValue('access-token');
    componentAny.getIdToken = jest.fn().mockResolvedValue({ userProfile: { ssin: '12345' } });

    jest.spyOn(component, 'userLanguage').mockReturnValue(UserLanguage.NL);

    jest.spyOn(document, 'createElement').mockReturnValue(mockWebComponent as unknown as HTMLElement);

    componentAny.orderHost = {
      nativeElement: {
        appendChild: jest.fn(),
      },
    };

    componentAny.proposalHost = {
      nativeElement: {
        appendChild: jest.fn(),
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onTabChange', () => {
    it('should create and append order web component when ssin is already resolved', async () => {
      component.patientSsin = '12345';

      component.onTabChange(0);
      await flushPromises();

      expect(document.createElement).toHaveBeenCalledWith(wrapperManifest.customElement.tag);
      expect((component as any).orderHost.nativeElement.appendChild).toHaveBeenCalledWith(mockWebComponent);
    });

    it('should create and append proposal web component for index 1', async () => {
      component.patientSsin = '12345';

      component.onTabChange(1);
      await flushPromises();

      expect(document.createElement).toHaveBeenCalledWith(wrapperManifest.customElement.tag);
      expect((component as any).proposalHost.nativeElement.appendChild).toHaveBeenCalledWith(mockWebComponent);
    });

    it('should not create web component when ssin cannot be resolved', async () => {
      (component as any).getIdToken = jest.fn().mockResolvedValue(null);

      component.onTabChange(0);
      await flushPromises();

      expect(document.createElement).not.toHaveBeenCalled();
      expect((component as any).orderHost.nativeElement.appendChild).not.toHaveBeenCalled();
    });

    it('should resolve patientSsin from token when not already set', async () => {
      component.patientSsin = undefined;

      component.onTabChange(0);
      await flushPromises();

      expect(component.patientSsin).toBe('12345');
    });
  });

  describe('resolvePatientSsin', () => {
    it('should return ssin when token has userProfile', async () => {
      const result = await (component as any).resolvePatientSsin();

      expect(result).toBe('12345');
      expect(component.patientSsin).toBe('12345');
    });

    it('should return undefined and log error when token is missing', async () => {
      (component as any).getIdToken = jest.fn().mockResolvedValue(null);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await (component as any).resolvePatientSsin();

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('token with userProfile.ssin is required');
    });

    it('should return undefined when token does not include userProfile', async () => {
      (hasUserProfile as unknown as jest.Mock).mockReturnValue(false);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await (component as any).resolvePatientSsin();

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('token with userProfile.ssin is required');
    });
  });

  describe('createWebcomponent', () => {
    it('should set services with getAccessToken', async () => {
      component.patientSsin = '12345';

      await (component as any).createWebcomponent(Intent.ORDER);

      expect(mockWebComponent.services).toBeDefined();
      expect(mockWebComponent.services.getAccessToken).toBeDefined();
    });

    it('should set correct attributes on the web component', async () => {
      component.patientSsin = '98765';

      await (component as any).createWebcomponent(Intent.ORDER);

      expect(mockWebComponent.setAttribute).toHaveBeenCalledWith('lang', Lang.NL.full);
      expect(mockWebComponent.setAttribute).toHaveBeenCalledWith('intent', Intent.ORDER);
      expect(mockWebComponent.setAttribute).toHaveBeenCalledWith('patient-ssin', '98765');
    });

    it('should register clickOpenDetail event listener that emits open event with intent', async () => {
      const openSpy = jest.spyOn(component.open, 'emit');
      component.patientSsin = '12345';

      await (component as any).createWebcomponent(Intent.ORDER);

      const handler = mockWebComponent.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'clickOpenDetail'
      )?.[1];

      handler({ detail: { id: 'uuid-123' } });

      expect(openSpy).toHaveBeenCalledWith({
        componentTag: wrapperManifest.events['open'].componentTag,
        props: {
          prescriptionId: 'uuid-123',
          intent: Intent.ORDER,
          lang: Lang.NL.full,
        },
      });
    });

    it('should store the created element in the instances map', async () => {
      component.patientSsin = '12345';

      await (component as any).createWebcomponent(Intent.PROPOSAL);

      expect((component as any).instances.get(Intent.PROPOSAL)).toBe(mockWebComponent);
    });
  });

  describe('activate (caching)', () => {
    it('should not create a second web component for the same intent', async () => {
      component.patientSsin = '12345';

      await (component as any).createWebcomponent(Intent.ORDER);
      (document.createElement as jest.Mock).mockClear();

      (component as any).activate(Intent.ORDER);
      await flushPromises();

      expect(document.createElement).not.toHaveBeenCalled();
    });
  });

  describe('initWebComponent', () => {
    it('should call translate.use with the user language', async () => {
      const translateService = TestBed.inject(TranslateService);
      const useSpy = jest.spyOn(translateService, 'use');

      await component.initWebComponent();

      expect(useSpy).toHaveBeenCalledWith(Lang.NL.full);
    });
  });

  describe('onSettingsChanged', () => {
    it('should update language on all existing web component instances', async () => {
      component.patientSsin = '12345';
      await (component as any).createWebcomponent(Intent.ORDER);
      mockWebComponent.setAttribute.mockClear();

      const secondMock = { setAttribute: jest.fn(), addEventListener: jest.fn(), getAttribute: jest.fn() };
      (document.createElement as jest.Mock).mockReturnValue(secondMock);
      await (component as any).createWebcomponent(Intent.PROPOSAL);

      jest.spyOn(component, 'userLanguage').mockReturnValue(UserLanguage.FR);

      component.onSettingsChanged({
        detail: { setting: 'userLanguage', value: UserLanguage.FR },
      } as any);

      expect(mockWebComponent.setAttribute).toHaveBeenCalledWith('lang', Lang.FR.full);
      expect(secondMock.setAttribute).toHaveBeenCalledWith('lang', Lang.FR.full);
    });

    it('should ignore settings changes that are not userLanguage', async () => {
      component.patientSsin = '12345';
      await (component as any).createWebcomponent(Intent.ORDER);
      mockWebComponent.setAttribute.mockClear();

      component.onSettingsChanged({
        detail: { setting: 'theme', value: 'dark' },
      } as any);

      expect(mockWebComponent.setAttribute).not.toHaveBeenCalled();
    });

    it('should update translate service when userLanguage changes', () => {
      const translateService = TestBed.inject(TranslateService);
      const useSpy = jest.spyOn(translateService, 'use');

      component.onSettingsChanged({
        detail: { setting: 'userLanguage', value: UserLanguage.FR },
      } as any);

      expect(useSpy).toHaveBeenCalledWith(Lang.FR.full);
    });
  });

  describe('ngAfterViewInit', () => {
    it('should activate the order tab by default', () => {
      component.patientSsin = '12345';
      const activateSpy = jest.spyOn(component as any, 'activate');

      component.ngAfterViewInit();

      expect(activateSpy).toHaveBeenCalledWith(Intent.ORDER);
    });
  });
});

/** Flush all pending microtasks (resolved promises). */
function flushPromises(): Promise<void> {
  return Promise.resolve();
}

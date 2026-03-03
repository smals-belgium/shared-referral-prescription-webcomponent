import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MagsPrescriptionDetails } from './mags-prescription-details.component';
import { hasUserProfile } from '@reuse/code/utils/mags-utils';
import { PrintMimeType, PrintOrientation } from '@smals-belgium/myhealth-wc-integration';
import { HOST_SERVICES } from '@reuse/code/components/wrappers/injection-tokens/host-services.injection-token';
import { HOST_SETTINGS } from '@reuse/code/components/wrappers//injection-tokens/host-settings.injection-token';

jest.mock('@reuse/code/utils/mags-utils', () => ({
  hasUserProfile: jest.fn(),
}));

describe('MagsPrescriptionDetails', () => {
  let component: MagsPrescriptionDetails;
  let fixture: ComponentFixture<MagsPrescriptionDetails>;
  let mockWebComponent: any;
  let mockHostServices: any;
  let mockHostSettings: any;

  beforeEach(async () => {
    mockWebComponent = {
      services: null,
      lang: 'nl-BE',
      setAttribute: jest.fn(),
      addEventListener: jest.fn(),
    };

    mockHostServices = {
      getAccessToken: jest.fn().mockResolvedValue('access-token'),
      getIdToken: jest.fn().mockResolvedValue({ userProfile: { ssin: '12345' } }),
    };

    mockHostSettings = {
      language: 'en',
    };

    await TestBed.configureTestingModule({
      imports: [MagsPrescriptionDetails],
      providers: [
        { provide: HOST_SERVICES, useValue: mockHostServices },
        { provide: HOST_SETTINGS, useValue: mockHostSettings },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MagsPrescriptionDetails);
    component = fixture.componentInstance;

    //mocks for MagsComponent
    const componentAny = component as any;

    componentAny.createElement = jest.fn().mockReturnValue(mockWebComponent);
    componentAny.getAccessToken = jest.fn().mockResolvedValue('access-token');
    componentAny.getIdToken = jest.fn().mockResolvedValue({ userProfile: { ssin: '12345' } });
    componentAny.appendWebComponent = jest.fn();

    jest.spyOn(component, 'userLanguage').mockReturnValue('nl');

    componentAny.componentView = {
      nativeElement: {
        getElementsByTagName: jest.fn().mockReturnValue([mockWebComponent]),
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('blobToBase64', () => {
    it('should convert blob to base64 string', async () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const result = await component.blobToBase64(blob);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should reject when FileReader returns non-string result', async () => {
      const blob = new Blob(['test']);
      const mockReader = {
        readAsDataURL: jest.fn(),
        onloadend: null as any,
        result: null,
      };
      jest.spyOn(window, 'FileReader').mockImplementation(() => mockReader as any);

      const promise = component.blobToBase64(blob);
      mockReader.onloadend?.();

      await expect(promise).rejects.toThrow('Failed to convert blob to base64');
    });

    it('should reject when FileReader encounters an error', async () => {
      const blob = new Blob(['test']);
      const mockError = new Error('Read error');
      const mockReader = {
        readAsDataURL: jest.fn(),
        onerror: null as any,
        error: mockError,
      };
      jest.spyOn(window, 'FileReader').mockImplementation(() => mockReader as any);

      const promise = component.blobToBase64(blob);
      mockReader.onerror?.();

      await expect(promise).rejects.toEqual(mockError);
    });
  });

  describe('initWebComponent', () => {
    it('should create web component and set services', () => {
      component.initWebComponent();

      expect((component as any).createElement).toHaveBeenCalled();
      expect(mockWebComponent.services).toBeDefined();
      expect(mockWebComponent.services.getAccessToken).toBeDefined();
      expect(mockWebComponent.services.getIdToken).toBeDefined();
    });

    it('should set correct attributes on web component', () => {
      fixture.componentRef.setInput('prescriptionId', 'uuid-123');
      component.initWebComponent();

      expect(mockWebComponent.setAttribute).toHaveBeenCalledWith('lang', 'nl-BE');
      expect(mockWebComponent.setAttribute).toHaveBeenCalledWith('prescription-id', 'uuid-123');
      expect(mockWebComponent.setAttribute).toHaveBeenCalledWith('intent', 'order');
    });

    it('should register clickPrint event listener that emits print event', async () => {
      const printSpy = jest.spyOn(component.print, 'emit');
      fixture.componentRef.setInput('prescriptionId', 'uuid-123');
      jest.spyOn(component, 'blobToBase64').mockResolvedValue('base64content');

      component.initWebComponent();

      const clickPrintHandler = mockWebComponent.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'clickPrint'
      )?.[1];

      await clickPrintHandler({ detail: new Blob(['pdf']) } as CustomEvent);

      expect(printSpy).toHaveBeenCalledWith({
        prescriptionId: 'uuid-123',
        lang: 'nl-BE',
        content: 'base64content',
        mimeType: PrintMimeType.BASE64,
        orientation: PrintOrientation.PORTRAIT,
      });
    });

    it('should register clickOpenExtendedDetail event listener', async () => {
      (hasUserProfile as unknown as jest.Mock).mockReturnValue(true);
      const updateAttrSpy = jest.spyOn(component, 'updateAttribute');
      component.initWebComponent();

      const handler = mockWebComponent.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'clickOpenExtendedDetail'
      )?.[1];

      await handler({ detail: 'new-uuid-123' });

      expect(updateAttrSpy).toHaveBeenCalledWith('patient-ssin', '12345');
      expect(updateAttrSpy).toHaveBeenCalledWith('prescription-id', 'new-uuid-123');
    });
  });

  describe('updateAttribute', () => {
    it('should update attribute on web component', () => {
      component.updateAttribute('patient-ssin', '98765');
      expect(mockWebComponent.setAttribute).toHaveBeenCalledWith('patient-ssin', '98765');
    });
  });

  describe('resolvePatientSsin', () => {
    it('should return ssin when token has userProfile', async () => {
      (hasUserProfile as unknown as jest.Mock).mockReturnValue(true);
      const result = await (component as any).resolvePatientSsin();
      expect(result).toBe('12345');
    });

    it('should return undefined and log error when token is missing', async () => {
      (component as any).getIdToken = jest.fn().mockResolvedValue(null);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await (component as any).resolvePatientSsin();

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('token with userProfile.ssin is required');
    });

    it('should return undefined when token lacks userProfile', async () => {
      (hasUserProfile as unknown as jest.Mock).mockReturnValue(false);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await (component as any).resolvePatientSsin();

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('token with userProfile.ssin is required');
    });
  });
});

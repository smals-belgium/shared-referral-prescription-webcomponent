import { TestBed } from '@angular/core/testing';
import { IconRegistryService } from './icon-registry.service';
import { MATERIAL_ICONS } from '@reuse/code/constants/icons';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

const safeSvg = {};

describe('IconRegistryService', () => {
  let service: IconRegistryService;
  const mockMatIconRegistry = {
    addSvgIconLiteral: jest.fn(),
  };

  const mockSanitizer = {
    bypassSecurityTrustHtml: jest.fn().mockReturnValue(safeSvg),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        IconRegistryService,
        { provide: MatIconRegistry, useValue: mockMatIconRegistry },
        { provide: DomSanitizer, useValue: mockSanitizer },
      ],
    });

    service = TestBed.inject(IconRegistryService);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not register icons when init is called without values', () => {
    const registerAddSpy = jest.spyOn((service as any).registered, 'add');
    service.init();

    expect(registerAddSpy).not.toHaveBeenCalled();
    expect(mockMatIconRegistry.addSvgIconLiteral).not.toHaveBeenCalled();
    expect(mockSanitizer.bypassSecurityTrustHtml).not.toHaveBeenCalled();
  });

  it('should return a console warning when init is called without correct icon names', () => {
    const registerAddSpy = jest.spyOn((service as any).registered, 'add');
    const invalidName = 'invalid_name';
    service.init(invalidName);

    expect(console.warn).toHaveBeenCalledWith(`Icon "${invalidName}" not found in ICON_MAP`);

    expect(registerAddSpy).not.toHaveBeenCalled();
    expect(mockMatIconRegistry.addSvgIconLiteral).not.toHaveBeenCalled();
    expect(mockSanitizer.bypassSecurityTrustHtml).not.toHaveBeenCalled();
  });

  it('should not register icons when init is called with duplicated values', () => {
    const duplicatedName = 'update';
    const registerAddSpy = jest.spyOn((service as any).registered, 'add');
    service.init(duplicatedName);

    expect(registerAddSpy).toHaveBeenNthCalledWith(1, duplicatedName);
    expect(mockMatIconRegistry.addSvgIconLiteral).toHaveBeenNthCalledWith(1, duplicatedName, safeSvg);
    expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenNthCalledWith(1, MATERIAL_ICONS[duplicatedName]);

    service.init(duplicatedName);

    expect(registerAddSpy).not.toHaveBeenNthCalledWith(2, duplicatedName);
    expect(mockMatIconRegistry.addSvgIconLiteral).not.toHaveBeenNthCalledWith(2, duplicatedName, safeSvg);
    expect(mockSanitizer.bypassSecurityTrustHtml).not.toHaveBeenNthCalledWith(2, MATERIAL_ICONS[duplicatedName]);
  });

  it('should register multiple icons when init is called with multiple values', () => {
    const registerAddSpy = jest.spyOn((service as any).registered, 'add');

    const svg_1 = 'close';
    const svg_2 = 'add';
    const svg_3 = 'update';

    service.init(svg_1, svg_2, svg_3);

    expect(registerAddSpy).toHaveBeenNthCalledWith(1, svg_1);
    expect(mockMatIconRegistry.addSvgIconLiteral).toHaveBeenNthCalledWith(1, svg_1, safeSvg);
    expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenNthCalledWith(1, MATERIAL_ICONS[svg_1]);

    expect(registerAddSpy).toHaveBeenNthCalledWith(2, svg_2);
    expect(mockMatIconRegistry.addSvgIconLiteral).toHaveBeenNthCalledWith(2, svg_2, safeSvg);
    expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenNthCalledWith(2, MATERIAL_ICONS[svg_2]);

    expect(registerAddSpy).toHaveBeenNthCalledWith(3, svg_3);
    expect(mockMatIconRegistry.addSvgIconLiteral).toHaveBeenNthCalledWith(3, svg_3, safeSvg);
    expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenNthCalledWith(3, MATERIAL_ICONS[svg_3]);
  });
});

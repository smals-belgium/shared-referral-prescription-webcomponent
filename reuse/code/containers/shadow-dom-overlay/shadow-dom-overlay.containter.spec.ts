import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';
import { OVERLAY_QUERY_SELECTOR, ShadowDomOverlayContainer } from './shadow-dom-overlay.container';

const overlayQuerySelector = 'nihdi-referral-prescription-create';

describe('ShadowDomOverlayContainer', () => {
  let service: ShadowDomOverlayContainer;
  let mockDocument: any;
  let mockShadowRoot: any;
  let mockRootElement: any;

  beforeEach(() => {
    // Create mock shadow root
    mockShadowRoot = {
      appendChild: jest.fn(),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn().mockReturnValue([]),
      contains: jest.fn(),
    };

    // Create mock root element with shadow root
    mockRootElement = {
      shadowRoot: mockShadowRoot,
      appendChild: jest.fn(),
      contains: jest.fn().mockReturnValue(false),
    };

    // Create mock document
    mockDocument = {
      body: {
        appendChild: jest.fn(),
        querySelector: jest.fn(),
        contains: jest.fn().mockReturnValue(false),
      },
      querySelector: jest.fn().mockReturnValue(mockRootElement),
      querySelectorAll: jest.fn().mockImplementation((selector: string) => {
        // Return the mock root element when querying for the overlay selector
        if (selector === overlayQuerySelector) {
          return [mockRootElement];
        }
        return [];
      }),
      createElement: jest.fn().mockImplementation((tagName: string) => {
        const element = {
          tagName: tagName.toUpperCase(),
          classList: {
            add: jest.fn(),
          },
          appendChild: jest.fn(),
          setAttribute: jest.fn(),
          getAttribute: jest.fn(),
          removeAttribute: jest.fn(),
          remove: jest.fn(),
          isConnected: true,
          cloneNode: jest.fn(),
        };
        element.cloneNode.mockReturnValue({...element, cloneNode: jest.fn()});
        return element;
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        ShadowDomOverlayContainer,
        {provide: DOCUMENT, useValue: mockDocument},
        {provide: OVERLAY_QUERY_SELECTOR, useValue: [overlayQuerySelector]},
      ],
    });

    service = TestBed.inject(ShadowDomOverlayContainer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created and extend OverlayContainer', () => {
    expect(service).toBeTruthy();
    expect(service).toBeInstanceOf(OverlayContainer);
  });

  it('should call super.ngOnDestroy() when ngOnDestroy is called', () => {
    const superNgOnDestroySpy = jest.spyOn(OverlayContainer.prototype, 'ngOnDestroy');

    service.ngOnDestroy();

    expect(superNgOnDestroySpy).toHaveBeenCalled();
  });

  it('should return shadow roots array from getRootElements()', () => {
    const result = service.getRootElements();

    expect(mockDocument.querySelectorAll).toHaveBeenCalledWith(overlayQuerySelector);
    expect(result).toEqual([mockShadowRoot]);
  });

  it('should call _createContainer() when createContainer() is invoked', () => {
    const createContainerSpy = jest.spyOn(service as any, '_createContainer');

    service.createContainer();

    expect(createContainerSpy).toHaveBeenCalled();
  });

  it('should create container and return it when getContainerElement() is called first time', () => {
    const createContainerSpy = jest.spyOn(service as any, '_createContainer');

    const result = service.getContainerElement();

    expect(createContainerSpy).toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it('should recreate container if existing container is not connected', () => {
    // First call to create initial container
    const initialContainer = service.getContainerElement();

    // Simulate disconnected container
    Object.defineProperty(initialContainer, 'isConnected', {
      value: false,
      writable: true,
    });

    const createContainerSpy = jest.spyOn(service as any, '_createContainer');

    // Second call should recreate container
    const result = service.getContainerElement();

    expect(createContainerSpy).toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it('should return existing container if it is still connected', () => {
    // Create initial container
    const initialContainer = service.getContainerElement();
    const createContainerSpy = jest.spyOn(service as any, '_createContainer');

    // Second call should return same container without recreating
    const result = service.getContainerElement();

    expect(createContainerSpy).not.toHaveBeenCalled();
    expect(result).toBe(initialContainer);
  });

  it('should append cloned container to shadow root when shadow root exists', () => {
    const appendToRootComponentSpy = jest.spyOn(service as any, '_appendToRootComponent');

    const container = service.getContainerElement();

    expect(appendToRootComponentSpy).toHaveBeenCalled();
    expect(container.cloneNode).toHaveBeenCalledWith(true);
    expect(mockShadowRoot.appendChild).toHaveBeenCalled();
  });

  it('should append cloned container to document body when shadow root does not exist', () => {
    // Mock scenario where shadow root is null
    mockRootElement.shadowRoot = null;

    const container = service.getContainerElement();

    expect(container.cloneNode).toHaveBeenCalledWith(true);
    expect(mockDocument.body.appendChild).toHaveBeenCalled();
  });

  it('should not append anything if container element does not exist in _appendToRootComponent', () => {
    const appendMethod = (service as any)._appendToRootComponent.bind(service);

    // Call without creating container first
    appendMethod();

    expect(mockShadowRoot.appendChild).not.toHaveBeenCalled();
    expect(mockDocument.body.appendChild).not.toHaveBeenCalled();
  });

  describe('Multiple selectors behavior', () => {
    it('should handle multiple selectors and return nested shadow roots', () => {
      const selectorA = 'component-a';
      const selectorB = 'component-b';

      const shadowRootB1 = {
        appendChild: jest.fn(),
        querySelectorAll: jest.fn().mockReturnValue([]),
        contains: jest.fn()
      };
      const shadowRootB2 = {
        appendChild: jest.fn(),
        querySelectorAll: jest.fn().mockReturnValue([]),
        contains: jest.fn()
      };

      const elementB1 = {shadowRoot: shadowRootB1, querySelectorAll: jest.fn(), contains: jest.fn()};
      const elementB2 = {shadowRoot: shadowRootB2, querySelectorAll: jest.fn(), contains: jest.fn()};

      const shadowRootA1 = {
        querySelectorAll: jest.fn().mockImplementation((s: string) => s === selectorB ? [elementB1] : []),
        contains: jest.fn(),
      };
      const shadowRootA2 = {
        querySelectorAll: jest.fn().mockImplementation((s: string) => s === selectorB ? [elementB2] : []),
        contains: jest.fn(),
      };

      const elementA1 = {shadowRoot: shadowRootA1, contains: jest.fn()};
      const elementA2 = {shadowRoot: shadowRootA2, contains: jest.fn()};

      mockDocument.querySelectorAll = jest.fn().mockImplementation((s: string) => {
        return s === selectorA ? [elementA1, elementA2] : [];
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ShadowDomOverlayContainer,
          {provide: DOCUMENT, useValue: mockDocument},
          {provide: OVERLAY_QUERY_SELECTOR, useValue: [selectorA, selectorB]},
        ],
      });

      const localService = TestBed.inject(ShadowDomOverlayContainer);

      const results = localService.getRootElements();

      expect(mockDocument.querySelectorAll).toHaveBeenCalledWith(selectorA);
      expect(shadowRootA1.querySelectorAll).toHaveBeenCalledWith(selectorB);
      expect(shadowRootA2.querySelectorAll).toHaveBeenCalledWith(selectorB);

      expect(results).toEqual([shadowRootB1, shadowRootB2]);
    });
  });
});

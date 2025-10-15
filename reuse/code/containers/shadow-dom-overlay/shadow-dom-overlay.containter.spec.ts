import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ShadowDomOverlayContainer } from './shadow-dom-overlay.container';

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
      contains: jest.fn(),
    };

    // Create mock root element with shadow root
    mockRootElement = {
      shadowRoot: mockShadowRoot,
      appendChild: jest.fn(),
    };

    // Create mock document
    mockDocument = {
      body: {
        appendChild: jest.fn(),
        querySelector: jest.fn(),
      },
      querySelector: jest.fn().mockReturnValue(mockRootElement),
      querySelectorAll: jest.fn().mockReturnValue([]),
      createElement: jest.fn().mockImplementation((tagName: string) => ({
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
      })),
    };

    TestBed.configureTestingModule({
      providers: [ShadowDomOverlayContainer, { provide: DOCUMENT, useValue: mockDocument }],
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

  it('should return shadow root from getRootElement()', () => {
    const result = service.getRootElement();

    expect(mockDocument.querySelector).toHaveBeenCalledWith('nihdi-referral-prescription-list');
    expect(result).toBe(mockShadowRoot);
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

  it('should append container to shadow root when shadow root exists', () => {
    const appendToRootComponentSpy = jest.spyOn(service as any, '_appendToRootComponent');

    service.getContainerElement();

    expect(appendToRootComponentSpy).toHaveBeenCalled();
    expect(mockShadowRoot.appendChild).toHaveBeenCalled();
  });

  it('should append container to document body when shadow root does not exist', () => {
    // Mock scenario where shadow root is null
    mockRootElement.shadowRoot = null;

    service.getContainerElement();

    expect(mockDocument.body.appendChild).toHaveBeenCalled();
  });

  it('should not append anything if container element does not exist in _appendToRootComponent', () => {
    const appendMethod = (service as any)._appendToRootComponent.bind(service);

    // Call without creating container first
    appendMethod();

    expect(mockShadowRoot.appendChild).not.toHaveBeenCalled();
    expect(mockDocument.body.appendChild).not.toHaveBeenCalled();
  });
});

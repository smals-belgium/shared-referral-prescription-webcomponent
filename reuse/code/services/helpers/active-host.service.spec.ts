import { ActiveOverlayHostService } from './active-host.service';

describe('ActiveOverlayHostService', () => {
  let service: ActiveOverlayHostService;

  beforeAll(() => {
    if (typeof PointerEvent === 'undefined') {
      (window as any).PointerEvent = class PointerEvent extends MouseEvent {
        constructor(type: string, params: PointerEventInit = {}) {
          super(type, params);
        }
      };
    }
  });

  beforeEach(() => {
    service = new ActiveOverlayHostService();
  });

  it('should return null initially', () => {
    expect(service.get()).toBeNull();
  });

  it('should become active when a registered element receives a pointerdown event', () => {
    const el = document.createElement('div');
    service.set(el);
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(service.get()).toBe(el);
  });

  it('should become active when a registered element receives a focusin event', () => {
    const el = document.createElement('div');
    service.set(el);
    el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(service.get()).toBe(el);
  });

  it('should switch active host when a different registered element is interacted with', () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    service.set(el1);
    service.set(el2);

    el1.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(service.get()).toBe(el1);

    el2.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(service.get()).toBe(el2);
  });

  it('should not change active host when already active element is interacted with again', () => {
    const el = document.createElement('div');
    service.set(el);

    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    const setSpy = jest.spyOn(service['activeHost'], 'set');

    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('should clear the active host when the active element is cleared', () => {
    const el = document.createElement('div');
    service.set(el);
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    service.clear(el);
    expect(service.get()).toBeNull();
  });

  it('should not clear the active host when a non-active element is cleared', () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    service.set(el1);
    service.set(el2);

    el1.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    service.clear(el2);

    expect(service.get()).toBe(el1);
  });

  it('should not react to events after deregistration', () => {
    const el = document.createElement('div');
    service.set(el);
    service.clear(el);

    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(service.get()).toBeNull();
  });
});

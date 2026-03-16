import { ActiveOverlayHostService } from './active-host.service';

describe('ActiveOverlayHostService', () => {
  let service: ActiveOverlayHostService;

  beforeEach(() => {
    service = new ActiveOverlayHostService();
  });

  it('should return null initially', () => {
    expect(service.get()).toBeNull();
  });

  it('should return the element after set', () => {
    const el = document.createElement('div');
    service.set(el);
    expect(service.get()).toBe(el);
  });

  it('should clear the host when the same element is passed', () => {
    const el = document.createElement('div');
    service.set(el);
    service.clear(el);
    expect(service.get()).toBeNull();
  });

  it('should not clear the host when a different element is passed', () => {
    const el = document.createElement('div');
    service.set(el);
    service.clear(document.createElement('div'));
    expect(service.get()).toBe(el);
  });
});

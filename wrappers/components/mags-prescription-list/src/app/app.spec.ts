import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { HOST_SERVICES } from '@reuse/code/components/wrappers/injection-tokens/host-services.injection-token';
import { HOST_SETTINGS } from '@reuse/code/components/wrappers/injection-tokens/host-settings.injection-token';

describe('App', () => {
  const mockHostServices = {
    getAccessToken: jest.fn().mockResolvedValue('access-token'),
    getIdToken: jest.fn().mockResolvedValue({ userProfile: { ssin: '12345' } }),
  };

  const mockHostSettings = {
    language: 'en',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: HOST_SERVICES, useValue: mockHostServices },
        { provide: HOST_SETTINGS, useValue: mockHostSettings },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});

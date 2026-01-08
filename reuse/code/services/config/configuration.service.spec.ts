import { ConfigurationService } from './configuration.service';
import { TestBed } from '@angular/core/testing';

describe('ConfigService', () => {
  let configurationService: ConfigurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConfigurationService]
    });
    configurationService = TestBed.inject(ConfigurationService);
  });

  it('service should have created successfully', () => {
    expect(configurationService).toBeTruthy();
  });

  it('should throw an error when getEnvironment is called', () => {
    expect(configurationService.getEnvironment).toThrow('Not implemented');
  });

  it('should throw an error when getEnvironmentVariable is called', () => {
    expect(configurationService.getEnvironmentVariable).toThrow('Not implemented');
  });
});

const mockConfigService = {
  getEnvironment: true
};

describe('ConfigService with implementation', () => {
  let configurationService: ConfigurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ConfigurationService, useValue: mockConfigService }]
    });
    configurationService = TestBed.inject(ConfigurationService);
  });

  it('service should have created successfully', () => {
    expect(configurationService).toBeTruthy();
  });

  it('should throw an error when getEnvironment is called', () => {
    expect(configurationService.getEnvironment).toEqual(true);
  });

});



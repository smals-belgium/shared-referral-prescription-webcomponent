import { TestBed } from '@angular/core/testing';
import { PssService } from './pss.service';
import { ExternalSource } from '@smals/vas-evaluation-form-ui-core';
import { ExternalSourceService } from './externalSourceService.service';
import DoneCallback = jest.DoneCallback;

describe('ExternalSourceService', () => {
  let service: ExternalSourceService;

  beforeEach(() => {
    const pssServiceMock = {
      getStatus: jest.fn(),
      getPssSessionId: jest.fn(),
      setPssSessionId: jest.fn(),
      getIndications: jest.fn(),
      getIntentions: jest.fn(),
      geDefault: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        ExternalSourceService,
        { provide: PssService, useValue: pssServiceMock }
      ]
    });

    service = TestBed.inject(ExternalSourceService);
  });

  it('should throw error when value is "failed"', (done: DoneCallback) => {
    const externalSource: ExternalSource = { dataUrl: 'test-url' };

    service.handleAutocomplete(externalSource, 'FAILED').subscribe({
      error: (error) => {
        expect(error).toBe('FAILED');
        done();
      }
    });
  });

  it('should return valid result', (done: DoneCallback) => {
    const externalSource: ExternalSource = { dataUrl: 'test-url' };

    service.handleValidation(externalSource, 'test-value').subscribe({
      next: (result) => {
        expect(result).toEqual({ valid: true });
        done();
      }
    });
  });

  it('should return "female" for "f"', () => {
    expect(service.getGender('f')).toBe('female');
  });

  it('should return "female" for "F"', () => {
    expect(service.getGender('F')).toBe('female');
  });

  it('should return "male" for any other value', () => {
    expect(service.getGender('m')).toBe('male');
    expect(service.getGender('M')).toBe('male');
    expect(service.getGender('other')).toBe('male');
  });

  it('should return "male" for undefined', () => {
    expect(service.getGender(undefined)).toBe('male');
  });
});

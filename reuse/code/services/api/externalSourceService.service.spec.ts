import { TestBed } from '@angular/core/testing';
import { ExternalSource } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { ExternalSourceService } from './externalSourceService.service';
import { firstValueFrom, of } from 'rxjs';
import { TerminologyService } from './terminology.service';

describe('ExternalSourceService', () => {
  let service: ExternalSourceService;
  let terminologyServiceMock: {
    getValueSet: jest.Mock;
  };

  const terminologyOption = {
    value: 'opt-1',
    label: { nl: 'NL', fr: 'FR', de: 'DE', en: 'EN' },
  } as any;

  beforeEach(() => {
    terminologyServiceMock = {
      getValueSet: jest.fn().mockReturnValue(of([terminologyOption])),
    };

    TestBed.configureTestingModule({
      providers: [ExternalSourceService, { provide: TerminologyService, useValue: terminologyServiceMock }],
    });

    service = TestBed.inject(ExternalSourceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when autocomplete value is "failed"', async () => {
    const externalSource: ExternalSource = { dataUrl: 'test-url' };

    await expect(firstValueFrom(service.handleAutocomplete(externalSource, 'FAILED'))).rejects.toBe('FAILED');
  });

  it('should throw when autocomplete external source has no dataUrl', async () => {
    await expect(firstValueFrom(service.handleAutocomplete({} as ExternalSource, '{"query":"abc"}'))).rejects.toBe(
      'No external source provided!'
    );
  });

  it('should call getValueSet when autocomplete path matches', async () => {
    const externalSource: ExternalSource = { dataUrl: 'api/terminology/valueSet/clinicalIndications/search' };

    const result = await firstValueFrom(service.handleAutocomplete(externalSource, '{"query":"Headache"}'));

    expect(terminologyServiceMock.getValueSet).toHaveBeenCalledWith('clinicalIndications', 'headache');
    expect(result).toEqual([
      {
        value: 'opt-1',
        label: { nl: 'NL', fr: 'FR', de: 'DE', en: 'EN' },
      },
    ]);
  });

  it('should throw when call getValueSet with no valueSetId', async () => {
    const externalSource: ExternalSource = { dataUrl: 'api/terminology/valueSet/' };

    await expect(firstValueFrom(service.handleAutocomplete(externalSource, '{"query":"abc"}'))).rejects.toBe(
      'No value set id provided!'
    );
  });

  it('should throw when autocomplete path is not supported', async () => {
    const externalSource: ExternalSource = { dataUrl: 'api/terminology/unknown' };

    await expect(firstValueFrom(service.handleAutocomplete(externalSource, '{"query":"abc"}'))).rejects.toBe(
      'No correct path provided!'
    );
  });

  it('should call terminology/valueSet/ source for select options', async () => {
    const externalSource: ExternalSource = { dataUrl: `api/terminology/valueSet/selectOption` };

    const result = await firstValueFrom(service.handleSelectOptions(externalSource));

    expect(terminologyServiceMock.getValueSet).toHaveBeenCalled();
    expect(result).toEqual([
      {
        value: 'opt-1',
        label: { nl: 'NL', fr: 'FR', de: 'DE', en: 'EN' },
      },
    ]);
  });

  it('should throw when select options dataUrl is missing', async () => {
    await expect(firstValueFrom(service.handleSelectOptions({} as ExternalSource))).rejects.toBe(
      'No external source provided!'
    );
  });

  it('should throw when select options path is not supported', async () => {
    await expect(firstValueFrom(service.handleSelectOptions({ dataUrl: 'api/unsupported' }))).rejects.toBe(
      'No correct path provided!'
    );
  });

  it('should return valid result for handleValidation', async () => {
    const externalSource: ExternalSource = { dataUrl: 'anything' };

    const result = await firstValueFrom(service.handleValidation(externalSource, 'test-value'));

    expect(result).toEqual({ valid: true });
  });
});

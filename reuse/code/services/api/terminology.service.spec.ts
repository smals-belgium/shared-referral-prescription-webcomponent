import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TerminologyService } from './terminology.service';
import { TerminologyService as ApiTerminologyService, ValueSetId } from '@reuse/code/openapi';

describe('TerminologyService', () => {
  let service: TerminologyService;
  let apiMock: jest.Mocked<ApiTerminologyService>;

  beforeEach(() => {
    apiMock = {
      getValueSet: jest.fn(),
    } as unknown as jest.Mocked<ApiTerminologyService>;

    TestBed.configureTestingModule({
      providers: [TerminologyService, { provide: ApiTerminologyService, useValue: apiMock }],
    });

    service = TestBed.inject(TerminologyService);
  });

  it('should delegate getValueSet to the api service', () => {
    apiMock.getValueSet.mockReturnValue(of([]) as any);

    service.getValueSet(ValueSetId.BeVsDiagnosticImagingCondition, 'abc');

    expect(apiMock.getValueSet).toHaveBeenCalledWith(ValueSetId.BeVsDiagnosticImagingCondition, 'abc');
  });

  it('should throw when incorrect value set id', () => {
    apiMock.getValueSet.mockReturnValue(of([]) as any);

    expect(() => service.getValueSet('BeVsDiagnosticImagingCondition', 'abc')).toThrow(
      'Unknown valueSetId: BeVsDiagnosticImagingCondition'
    );
  });
});

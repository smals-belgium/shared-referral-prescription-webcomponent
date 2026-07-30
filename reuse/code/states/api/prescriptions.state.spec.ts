import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PrescriptionsState } from './prescriptions.state';
import { PrescriptionService } from '../../services/api/prescription.service';
import { LoadingStatus } from '../../interfaces';

describe('PrescriptionsState', () => {
  let prescriptionsState: PrescriptionsState;
  let prescriptionServiceMock: jest.Mocked<PrescriptionService>;

  beforeEach(() => {
    prescriptionServiceMock = {
      findAll: jest.fn(),
    } as unknown as jest.Mocked<PrescriptionService>;

    TestBed.configureTestingModule({
      providers: [PrescriptionsState, { provide: PrescriptionService, useValue: prescriptionServiceMock }],
    });

    prescriptionsState = TestBed.inject(PrescriptionsState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadPrescriptions - page calculation', () => {
    it('should keep the current page when rawPatientSsin is unchanged and no explicit page is given', () => {
      prescriptionServiceMock.findAll.mockReturnValue(of({}));
      jest.spyOn(prescriptionsState, 'state').mockReturnValue({
        status: LoadingStatus.SUCCESS,
        params: { page: 3, pageSize: 10, rawPatientSsin: '12345' },
      });

      prescriptionsState.loadPrescriptions(undefined, undefined, undefined, '12345');

      expect(prescriptionServiceMock.findAll).toHaveBeenCalledWith(undefined, 3, 10);
    });

    it('should reset to page 1 when rawPatientSsin changes', () => {
      prescriptionServiceMock.findAll.mockReturnValue(of({}));
      jest.spyOn(prescriptionsState, 'state').mockReturnValue({
        status: LoadingStatus.SUCCESS,
        params: { page: 3, pageSize: 10, rawPatientSsin: '12345' },
      });

      prescriptionsState.loadPrescriptions(undefined, undefined, undefined, '99999');

      expect(prescriptionServiceMock.findAll).toHaveBeenCalledWith(undefined, 1, 10);
    });

    it('should use the explicit page regardless of rawPatientSsin', () => {
      prescriptionServiceMock.findAll.mockReturnValue(of({}));
      jest.spyOn(prescriptionsState, 'state').mockReturnValue({
        status: LoadingStatus.SUCCESS,
        params: { page: 3, pageSize: 10, rawPatientSsin: '12345' },
      });

      prescriptionsState.loadPrescriptions(undefined, 2, undefined, '12345');

      expect(prescriptionServiceMock.findAll).toHaveBeenCalledWith(undefined, 2, 10);
    });

    it('should reset to page 1 when rawPatientSsin is undefined', () => {
      prescriptionServiceMock.findAll.mockReturnValue(of({}));
      jest.spyOn(prescriptionsState, 'state').mockReturnValue({
        status: LoadingStatus.SUCCESS,
        params: { page: 3, pageSize: 10, rawPatientSsin: '12345' },
      });

      prescriptionsState.loadPrescriptions(undefined, undefined, undefined, undefined);

      expect(prescriptionServiceMock.findAll).toHaveBeenCalledWith(undefined, 1, 10);
    });
  });
});

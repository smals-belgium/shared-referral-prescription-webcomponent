import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TemplateVersionsState } from './template-versions.state';
import { PrescriptionTemplateService } from '@reuse/code/services/api/prescriptionTemplate.service';
import { LoadingStatus } from '@reuse/code/interfaces';

describe('TemplateVersionsState', () => {
  let state: TemplateVersionsState;
  let prescriptionTemplateService: jest.Mocked<PrescriptionTemplateService>;

  const mockTemplateVersion = { templateId: 1, code: 'ASSISTING_WITH_PERSONAL_HYGIENE', version: '1' };

  beforeEach(() => {
    prescriptionTemplateService = {
      findOneVersion: jest.fn(),
    } as unknown as jest.Mocked<PrescriptionTemplateService>;

    TestBed.configureTestingModule({
      providers: [
        TemplateVersionsState,
        { provide: PrescriptionTemplateService, useValue: prescriptionTemplateService },
      ],
    });

    state = TestBed.inject(TemplateVersionsState);
  });

  describe('loadTemplateVersionForInstance', () => {
    it('sets success state with data on successful load', () => {
      prescriptionTemplateService.findOneVersion.mockReturnValue(of(mockTemplateVersion));

      state.loadTemplateVersionForInstance('instance-1', 'ASSISTING_WITH_PERSONAL_HYGIENE');

      const result = state.getStateForInstance('instance-1', 'ASSISTING_WITH_PERSONAL_HYGIENE');
      expect(result()).toEqual({ status: LoadingStatus.SUCCESS, data: mockTemplateVersion });
    });

    it('sets error state on failed load', () => {
      const error = { message: 'Not found' };
      prescriptionTemplateService.findOneVersion.mockReturnValue(throwError(() => error));

      state.loadTemplateVersionForInstance('instance-1', 'ASSISTING_WITH_PERSONAL_HYGIENE');

      const result = state.getStateForInstance('instance-1', 'ASSISTING_WITH_PERSONAL_HYGIENE');
      expect(result()).toEqual({ status: LoadingStatus.ERROR, error });
    });
  });

  describe('getStateForInstance', () => {
    it('creates initial state when not present', () => {
      const result = state.getStateForInstance('new-instance', 'TPL002');

      expect(result()).toEqual({ status: LoadingStatus.INITIAL });
    });

    it('returns existing state when present', () => {
      prescriptionTemplateService.findOneVersion.mockReturnValue(of(mockTemplateVersion));
      state.loadTemplateVersionForInstance('instance-1', 'ASSISTING_WITH_PERSONAL_HYGIENE');

      const result = state.getStateForInstance('instance-1', 'ASSISTING_WITH_PERSONAL_HYGIENE');

      expect(result().status).toBe(LoadingStatus.SUCCESS);
    });
  });

  describe('getState', () => {
    it('finds state by template code prefix', () => {
      prescriptionTemplateService.findOneVersion.mockReturnValue(of(mockTemplateVersion));
      state.loadTemplateVersionForInstance('instance-1', 'ASSISTING_WITH_PERSONAL_HYGIENE');

      const result = state.getState('ASSISTING_WITH_PERSONAL_HYGIENE');

      expect(result().status).toBe(LoadingStatus.SUCCESS);
    });

    it('creates initial state when no matching key found', () => {
      const result = state.getState('UNKNOWN');

      expect(result()).toEqual({ status: LoadingStatus.INITIAL });
    });
  });

  describe('cleanup', () => {
    it('removes specific instance state', () => {
      prescriptionTemplateService.findOneVersion.mockReturnValue(of(mockTemplateVersion));
      state.loadTemplateVersionForInstance('instance-1', 'ASSISTING_WITH_PERSONAL_HYGIENE');

      state.cleanupInstance('instance-1', 'ASSISTING_WITH_PERSONAL_HYGIENE');

      const result = state.getStateForInstance('instance-1', 'ASSISTING_WITH_PERSONAL_HYGIENE');
      expect(result()).toEqual({ status: LoadingStatus.INITIAL });
    });

    it('removes all instance states', () => {
      prescriptionTemplateService.findOneVersion.mockReturnValue(of(mockTemplateVersion));
      state.loadTemplateVersionForInstance('instance-1', 'ASSISTING_WITH_PERSONAL_HYGIENE');
      state.loadTemplateVersionForInstance('instance-2', 'TPL002');

      state.cleanupAllInstances();

      expect(state.getStateForInstance('instance-1', 'ASSISTING_WITH_PERSONAL_HYGIENE')()).toEqual({
        status: LoadingStatus.INITIAL,
      });
      expect(state.getStateForInstance('instance-2', 'TPL002')()).toEqual({ status: LoadingStatus.INITIAL });
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { PrescriptionState } from './prescription.state';
import { PrescriptionService } from '@reuse/code/services/api/prescription.service';
import { TaskService } from '@reuse/code/services/fhir/task.service';
import {
  LoadingStatus,
  PrescriptionExecutionComplete,
  PrescriptionExecutionStart,
  TaskExecutionFinish,
} from '@reuse/code/interfaces';
import {
  AssignationType,
  AssignCareGiverResource,
  ProviderType,
  ReasonResource,
  RequestStatus,
  Role,
} from '@reuse/code/openapi';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { USER_PROFILE_CLAIM_KEY } from '@reuse/code/services/auth/auth-constants';

describe('PrescriptionState', () => {
  let service: PrescriptionState;
  let prescriptionService: jest.Mocked<PrescriptionService>;
  let performerTaskService: jest.Mocked<TaskService>;

  const mockPrescriptionId = '123';
  const mockReferralTaskId = '456';
  const mockPerformerTaskId = '789';
  const mockUUID = 'mock-uuid-12345';
  const mockActorCaregiverSsin = 'mock_actor_ssin';
  const mockPrescriptionData = { id: mockPrescriptionId, status: RequestStatus.Open };

  beforeAll(() => {
    const wcAuthServiceMock = {
      isOrganization: jest.fn().mockReturnValue(of(true)),
      isProfessional: jest.fn().mockReturnValue(of(true)),
      getClaims: jest.fn().mockReturnValue(of({ [USER_PROFILE_CLAIM_KEY]: { ssin: mockActorCaregiverSsin } })),
    };
    const mockPrescriptionService = {
      findOne: jest.fn().mockReturnValue(of(mockPrescriptionData)),
      findOneByShortCode: jest.fn().mockReturnValue(of(mockPrescriptionData)),
      assignCaregivers: jest.fn(),
      assignOrganization: jest.fn(),
      transferAssignation: jest.fn(),
      cancel: jest.fn(),
      rejectAssignation: jest.fn(),
      completePrescription: jest.fn(),
      closePrescription: jest.fn(),
    };

    const mockTaskService = {
      startExecution: jest.fn(),
      restartExecution: jest.fn(),
      finishExecution: jest.fn(),
      cancelExecution: jest.fn(),
      interruptExecution: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PrescriptionState,
        { provide: PrescriptionService, useValue: mockPrescriptionService },
        { provide: TaskService, useValue: mockTaskService },
        { provide: AuthService, useValue: wcAuthServiceMock },
      ],
    });

    service = TestBed.inject(PrescriptionState);
    prescriptionService = TestBed.inject(PrescriptionService) as jest.Mocked<PrescriptionService>;
    performerTaskService = TestBed.inject(TaskService) as jest.Mocked<TaskService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadPrescription', () => {
    it('should successfully call prescriptionService.findOne', () => {
      service.loadPrescription(mockPrescriptionId);

      expect(prescriptionService.findOne).toHaveBeenCalledWith(mockPrescriptionId, mockActorCaregiverSsin);
    });
  });

  describe('resetPrescription', () => {
    it('should reset the signal state to initial', () => {
      service.loadPrescription(mockPrescriptionId);

      service.resetPrescription();

      expect(service.state()).toEqual({
        status: LoadingStatus.INITIAL,
        data: undefined,
        error: undefined,
      });
    });
  });

  describe('loadPrescriptionByShortCode', () => {
    it('should successfully call prescriptionService.findOneByShortCode', () => {
      const shortCode = 'mock_short_code';
      const ssin = 'mock_ssin';

      service.loadPrescriptionByShortCode(shortCode, ssin);

      expect(prescriptionService.findOneByShortCode).toHaveBeenCalledWith(shortCode, ssin, mockActorCaregiverSsin);
    });
  });

  describe('assignPrescriptionPerformer', () => {
    it('should successfully assign caregivers as professional and reload prescription', async () => {
      const ssinOrNihdi = '123456789';
      const role = 'NURSE';
      const type = 'Professional';
      const mockCaregiversResponse = [{ id: 'mock_id_1' }, { id: 'mock_id_2' }];

      prescriptionService.assignCaregivers.mockReturnValue(of(mockCaregiversResponse as any));

      const res = await firstValueFrom(
        service.assignPrescriptionPerformer(mockPrescriptionId, mockReferralTaskId, ssinOrNihdi, role, type, mockUUID)
      );

      expect(prescriptionService.assignCaregivers).toHaveBeenCalledWith(
        mockPrescriptionId,
        mockReferralTaskId,
        { ssin: ssinOrNihdi, role },
        mockUUID,
        undefined,
        undefined
      );
      expect(prescriptionService.findOne).toHaveBeenCalledWith(mockPrescriptionId, mockActorCaregiverSsin);
      expect(res).toEqual(mockCaregiversResponse);
    });

    it('should successfully assign organization when not a professional and reload prescription', async () => {
      const nihdi = '123456789123';
      const type = '132';

      prescriptionService.assignOrganization.mockReturnValue(of({ id: 'mock_id' } as any));

      await firstValueFrom(
        service.assignPrescriptionPerformer(mockPrescriptionId, mockReferralTaskId, nihdi, 'SOME_ROLE', type, mockUUID)
      );

      expect(prescriptionService.assignOrganization).toHaveBeenCalledWith(
        mockPrescriptionId,
        mockReferralTaskId,
        { nihii: nihdi, institutionTypeCode: type },
        mockUUID
      );
      expect(prescriptionService.findOne).toHaveBeenCalledWith(mockPrescriptionId, mockActorCaregiverSsin);
    });
  });

  describe('assignAndStartPrescriptionExecution', () => {
    it('should assign caregiver with uppercase discipline and start date, then reload prescription', async () => {
      const professional = { ssin: 'mock_ssin', discipline: 'nurse' };
      const executionStart: PrescriptionExecutionStart = { startDate: '2026-01-01' };

      prescriptionService.assignCaregivers.mockReturnValue(of([{ id: 'mock_id' }] as any));

      await firstValueFrom(
        service.assignAndStartPrescriptionExecution(
          mockPrescriptionId,
          mockReferralTaskId,
          professional,
          mockUUID,
          executionStart,
          AssignationType.External,
          undefined
        )
      );

      expect(prescriptionService.assignCaregivers).toHaveBeenCalledWith(
        mockPrescriptionId,
        mockReferralTaskId,
        {
          ssin: professional.ssin,
          role: 'NURSE',
          executionStartDate: executionStart.startDate,
        },
        mockUUID,
        AssignationType.External,
        undefined
      );
      expect(prescriptionService.findOne).toHaveBeenCalledWith(mockPrescriptionId, mockActorCaregiverSsin);
    });
  });

  describe('assignMultipleCaregivers', () => {
    const xActorOrganizationNihii11 = '12345678910';
    it('should call prescriptionService.assignCaregivers with caregiver list and reload prescription', async () => {
      const caregivers: AssignCareGiverResource[] = [
        { ssin: 'mock_ssin_1', role: Role.Caregiver },
        { ssin: 'mock_ssin_2', role: Role.Caregiver },
      ];
      const assignationType = AssignationType.Internal;

      prescriptionService.assignCaregivers.mockReturnValue(of([{ id: 'mock_id' }]));

      await firstValueFrom(
        service.assignMultipleCaregivers(
          mockPrescriptionId,
          mockReferralTaskId,
          caregivers,
          mockUUID,
          assignationType,
          xActorOrganizationNihii11
        )
      );

      expect(prescriptionService.assignCaregivers).toHaveBeenCalledWith(
        mockPrescriptionId,
        mockReferralTaskId,
        caregivers,
        mockUUID,
        assignationType,
        xActorOrganizationNihii11
      );
      expect(prescriptionService.findOne).toHaveBeenCalledWith(mockPrescriptionId, mockActorCaregiverSsin);
    });
  });

  describe('transferAssignation', () => {
    it('should transfer assignation with uppercase discipline and reload prescription', async () => {
      const professional = { ssin: 'mock_ssin', discipline: 'nurse' };

      prescriptionService.transferAssignation.mockReturnValue(of({} as any));

      await firstValueFrom(
        service.transferAssignation(
          mockPrescriptionId,
          mockReferralTaskId,
          mockPerformerTaskId,
          professional.ssin,
          Role.Caregiver,
          ProviderType.Professional,
          mockUUID
        )
      );

      expect(prescriptionService.transferAssignation).toHaveBeenCalledWith(
        mockPrescriptionId,
        mockReferralTaskId,
        mockPerformerTaskId,
        {
          ssin: professional.ssin,
          role: Role.Caregiver,
        },
        mockUUID
      );
      expect(prescriptionService.findOne).toHaveBeenCalledWith(mockPrescriptionId, mockActorCaregiverSsin);
    });
  });

  describe('cancelPrescription', () => {
    it('should delegate cancel call to prescriptionService', async () => {
      const mockReason: ReasonResource = { reason: 'mockReason' };
      prescriptionService.cancel.mockReturnValue(of({ cancelled: true } as any));

      const res = await firstValueFrom(service.cancelPrescription(mockPrescriptionId, mockReason, mockUUID));

      expect(res).toEqual({ cancelled: true });
      expect(prescriptionService.cancel).toHaveBeenCalledWith(mockPrescriptionId, mockReason, mockUUID);
    });
  });

  describe('rejectAssignation', () => {
    it('should reject assignation and reload prescription', async () => {
      prescriptionService.rejectAssignation.mockReturnValue(of({} as any));

      await firstValueFrom(service.rejectAssignation(mockPrescriptionId, mockPerformerTaskId, mockUUID));

      expect(prescriptionService.rejectAssignation).toHaveBeenCalledWith(
        mockPrescriptionId,
        mockPerformerTaskId,
        mockUUID
      );
      expect(prescriptionService.findOne).toHaveBeenCalledWith(mockPrescriptionId, mockActorCaregiverSsin);
    });
  });

  describe('startPrescriptionExecution', () => {
    it('should call performerTaskService.startExecution and reload prescription', async () => {
      const executionStart: PrescriptionExecutionStart = { startDate: '2026-02-01' };

      performerTaskService.startExecution.mockReturnValue(of({} as any));

      await firstValueFrom(
        service.startPrescriptionExecution(mockPrescriptionId, mockPerformerTaskId, executionStart, mockUUID)
      );

      expect(performerTaskService.startExecution).toHaveBeenCalledWith(mockPerformerTaskId, executionStart, mockUUID);
      expect(prescriptionService.findOne).toHaveBeenCalledWith(mockPrescriptionId, mockActorCaregiverSsin);
    });
  });

  describe('restartExecution', () => {
    it('should call performerTaskService.restartExecution and reload prescription', async () => {
      performerTaskService.restartExecution.mockReturnValue(of({} as any));

      await firstValueFrom(service.restartExecution(mockPrescriptionId, mockPerformerTaskId, mockUUID));

      expect(performerTaskService.restartExecution).toHaveBeenCalledWith(mockPerformerTaskId, mockUUID);
      expect(prescriptionService.findOne).toHaveBeenCalledWith(mockPrescriptionId, mockActorCaregiverSsin);
    });
  });

  describe('finishTaskExecution', () => {
    it('should call performerTaskService.finishExecution and reload prescription', async () => {
      const executionFinish: TaskExecutionFinish = { endDate: '2026-07-22' };

      performerTaskService.finishExecution.mockReturnValue(of({} as any));

      await firstValueFrom(
        service.finishTaskExecution(mockPrescriptionId, mockPerformerTaskId, executionFinish, mockUUID)
      );

      expect(performerTaskService.finishExecution).toHaveBeenCalledWith(mockPerformerTaskId, executionFinish, mockUUID);
      expect(prescriptionService.findOne).toHaveBeenCalledWith(mockPrescriptionId, mockActorCaregiverSsin);
    });
  });

  describe('cancelPrescriptionExecution', () => {
    it('should call performerTaskService.cancelExecution and reload prescription', async () => {
      performerTaskService.cancelExecution.mockReturnValue(of({} as any));

      await firstValueFrom(service.cancelPrescriptionExecution(mockPrescriptionId, mockPerformerTaskId, mockUUID));

      expect(performerTaskService.cancelExecution).toHaveBeenCalledWith(mockPerformerTaskId, mockUUID);
      expect(prescriptionService.findOne).toHaveBeenCalledWith(mockPrescriptionId, mockActorCaregiverSsin);
    });
  });

  describe('interruptPrescriptionExecution', () => {
    it('should call performerTaskService.interruptExecution and reload prescription', async () => {
      performerTaskService.interruptExecution.mockReturnValue(of({} as any));

      await firstValueFrom(service.interruptPrescriptionExecution(mockPrescriptionId, mockPerformerTaskId, mockUUID));

      expect(performerTaskService.interruptExecution).toHaveBeenCalledWith(mockPerformerTaskId, mockUUID);
      expect(prescriptionService.findOne).toHaveBeenCalledWith(mockPrescriptionId, mockActorCaregiverSsin);
    });
  });

  describe('completePrescriptionExecution', () => {
    it('should call prescriptionService.completePrescription and reload prescription', async () => {
      const executionComplete: PrescriptionExecutionComplete = { endDate: '2026-07-22', performerTaskId: 'mock_id' };

      prescriptionService.completePrescription.mockReturnValue(of({} as any));

      await firstValueFrom(service.completePrescriptionExecution(mockPrescriptionId, executionComplete, mockUUID));

      expect(prescriptionService.completePrescription).toHaveBeenCalledWith(
        mockPrescriptionId,
        executionComplete,
        mockUUID
      );
      expect(prescriptionService.findOne).toHaveBeenCalledWith(mockPrescriptionId, mockActorCaregiverSsin);
    });
  });

  describe('closePrescription', () => {
    it('should call prescriptionService.closePrescription and reload prescription', async () => {
      prescriptionService.closePrescription.mockReturnValue(of({} as any));

      await firstValueFrom(service.closePrescription(mockPrescriptionId, mockUUID));

      expect(prescriptionService.closePrescription).toHaveBeenCalledWith(mockPrescriptionId, mockUUID);
      expect(prescriptionService.findOne).toHaveBeenCalledWith(mockPrescriptionId, mockActorCaregiverSsin);
    });
  });
});

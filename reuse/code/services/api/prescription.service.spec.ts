import { PrescriptionService } from '@reuse/code/services/api/prescription.service';
import { TestBed } from '@angular/core/testing';
import {
  AssignationType,
  AssignCareGiverResource,
  AssignOrganizationResource,
  CreateRequestResource,
  PerformerTaskIdResource,
  PrescriptionService as ApiPrescriptionService,
  ReadRequestIdResource,
  ReadRequestResource,
  ReasonResource,
  Role,
} from '@reuse/code/openapi';
import { PrescriptionExecutionComplete, SearchPrescriptionCriteria } from '@reuse/code/interfaces';
import { firstValueFrom, of } from 'rxjs';

describe('PrescriptionService', () => {
  let service: PrescriptionService;
  let mockApi: jest.Mocked<ApiPrescriptionService>;

  const mockPrescriptionId = '123';
  const mockReferralTaskId = '456';
  const mockPerformerTaskId = '789';
  const mockUUID = 'mock-uuid-12345';

  beforeEach(() => {
    const mockApiPrescriptionService = {
      createPrescription: jest.fn(),
      getAllPrescriptions: jest.fn(),
      getPrescription: jest.fn(),
      getPrescriptionByShortCode: jest.fn(),
      cancelPrescription: jest.fn(),
      assignCareGiversToPrescription: jest.fn(),
      assignOrganizationToPrescription: jest.fn(),
      transferAssignationToPrescription: jest.fn(),
      rejectAssignationToPrescription: jest.fn(),
      completePrescription: jest.fn(),
      closePrescription: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [PrescriptionService, { provide: ApiPrescriptionService, useValue: mockApiPrescriptionService }],
    });

    service = TestBed.inject(PrescriptionService);
    mockApi = TestBed.inject(ApiPrescriptionService) as jest.Mocked<ApiPrescriptionService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('create', () => {
    it('should forward parameters to api.createPrescription using generatedUUID', async () => {
      const mockRequestResource: CreateRequestResource = { subject: 'mock_subject', templateCode: 'mock_templateCode' };
      const expectedResponse: ReadRequestIdResource = { id: mockPrescriptionId };

      mockApi.createPrescription.mockReturnValue(of(expectedResponse) as any);

      const response = await firstValueFrom(service.create(mockRequestResource, mockUUID));

      expect(mockApi.createPrescription).toHaveBeenCalledWith(mockUUID, mockRequestResource);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('findAll', () => {
    it('should forward all search criteria and pagination params to api.getAllPrescriptions', async () => {
      const mockCriteria: SearchPrescriptionCriteria = {
        patient: 'patient-123',
        requester: 'requester-456',
        performer: 'performer-789',
        historical: false,
      };

      mockApi.getAllPrescriptions.mockReturnValue(of({}) as any);

      await firstValueFrom(service.findAll(mockCriteria, 0, 10));

      expect(mockApi.getAllPrescriptions).toHaveBeenCalledWith(
        mockCriteria.patient,
        mockCriteria.requester,
        mockCriteria.performer,
        mockCriteria.historical,
        0,
        10
      );
    });

    it('should safely handle undefined criteria by passing undefined parameters', async () => {
      mockApi.getAllPrescriptions.mockReturnValue(of({}) as any);

      await firstValueFrom(service.findAll(undefined, 1, 25));

      expect(mockApi.getAllPrescriptions).toHaveBeenCalledWith(undefined, undefined, undefined, undefined, 1, 25);
    });
  });

  describe('findOne', () => {
    it('should fetch prescription by id', async () => {
      const expectedResult: ReadRequestResource = { id: mockPrescriptionId };
      mockApi.getPrescription.mockReturnValue(of(expectedResult) as any);

      const result = await firstValueFrom(service.findOne(mockPrescriptionId, 'xActorCaregiverSsin'));

      expect(mockApi.getPrescription).toHaveBeenCalledWith(mockPrescriptionId, 'xActorCaregiverSsin');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOneByShortCode', () => {
    it('should pass ssin first and shortCode second to api.getPrescriptionByShortCode', async () => {
      const shortCode = 'SC-001';
      const ssin = 'SSIN-888';
      const actorSsin = 'Actor-SSIN-999';
      mockApi.getPrescriptionByShortCode.mockReturnValue(of({}) as any);

      await firstValueFrom(service.findOneByShortCode(shortCode, ssin, actorSsin));

      expect(mockApi.getPrescriptionByShortCode).toHaveBeenCalledWith(ssin, shortCode, actorSsin);
    });
  });

  describe('cancel', () => {
    it('should delegate cancel request to api.cancelPrescription', async () => {
      const mockReason: ReasonResource = { reason: 'mock_reason' };
      mockApi.cancelPrescription.mockReturnValue(of({}) as any);

      await firstValueFrom(service.cancel(mockPrescriptionId, mockReason, mockUUID));

      expect(mockApi.cancelPrescription).toHaveBeenCalledWith(mockPrescriptionId, mockUUID, mockReason);
    });
  });

  describe('assignCaregivers', () => {
    const mockOrganizationNihii11 = '12345678910';

    it('single external assignation of caregiver without xActorOrganizationNihii11', async () => {
      const singleCaregiver: AssignCareGiverResource = { ssin: 'SSIN-1', role: Role.Caregiver };
      const mockResponse: PerformerTaskIdResource = { id: mockPerformerTaskId };
      const assignationType = AssignationType.External;

      mockApi.assignCareGiversToPrescription.mockReturnValue(of(mockResponse) as any);

      const response = await firstValueFrom(
        service.assignCaregivers(mockPrescriptionId, mockReferralTaskId, singleCaregiver, mockUUID, assignationType)
      );

      expect(mockApi.assignCareGiversToPrescription).toHaveBeenCalledWith(
        mockPrescriptionId,
        mockReferralTaskId,
        mockUUID,
        [singleCaregiver],
        assignationType,
        undefined
      );
      expect(response).toEqual(mockResponse);
    });

    it('multiple internal assignation of caregivers without xActorOrganizationNihii11', async () => {
      const caregiverArray: AssignCareGiverResource[] = [
        { ssin: 'SSIN-1', role: Role.Caregiver },
        { ssin: 'SSIN-2', role: Role.Caregiver },
      ];
      const assignationType = AssignationType.Internal;
      const mockResponse: PerformerTaskIdResource[] = [{ id: 'task-1' }, { id: 'task-2' }];

      mockApi.assignCareGiversToPrescription.mockReturnValue(of(mockResponse) as any);

      const response = await firstValueFrom(
        service.assignCaregivers(mockPrescriptionId, mockReferralTaskId, caregiverArray, mockUUID, assignationType)
      );

      expect(mockApi.assignCareGiversToPrescription).toHaveBeenCalledWith(
        mockPrescriptionId,
        mockReferralTaskId,
        mockUUID,
        caregiverArray,
        assignationType,
        undefined
      );
      expect(response).toEqual(mockResponse);
    });

    it('should pass xActorOrganizationNihii11 when provided with a single caregiver', async () => {
      const singleCaregiver: AssignCareGiverResource = { ssin: 'SSIN-1', role: Role.Caregiver };
      const mockResponse: PerformerTaskIdResource = { id: mockPerformerTaskId };
      const assignationType = AssignationType.External;

      mockApi.assignCareGiversToPrescription.mockReturnValue(of(mockResponse) as any);

      const response = await firstValueFrom(
        service.assignCaregivers(
          mockPrescriptionId,
          mockReferralTaskId,
          singleCaregiver,
          mockUUID,
          assignationType,
          mockOrganizationNihii11
        )
      );

      expect(mockApi.assignCareGiversToPrescription).toHaveBeenCalledWith(
        mockPrescriptionId,
        mockReferralTaskId,
        mockUUID,
        [singleCaregiver],
        assignationType,
        mockOrganizationNihii11
      );
      expect(response).toEqual(mockResponse);
    });

    it('should pass xActorOrganizationNihii11 when provided with an array of caregivers', async () => {
      const caregiverArray: AssignCareGiverResource[] = [
        { ssin: 'SSIN-1', role: Role.Caregiver },
        { ssin: 'SSIN-2', role: Role.Caregiver },
      ];
      const assignationType = AssignationType.Internal;
      const mockResponse: PerformerTaskIdResource[] = [{ id: 'task-1' }, { id: 'task-2' }];

      mockApi.assignCareGiversToPrescription.mockReturnValue(of(mockResponse) as any);

      const response = await firstValueFrom(
        service.assignCaregivers(
          mockPrescriptionId,
          mockReferralTaskId,
          caregiverArray,
          mockUUID,
          assignationType,
          mockOrganizationNihii11
        )
      );

      expect(mockApi.assignCareGiversToPrescription).toHaveBeenCalledWith(
        mockPrescriptionId,
        mockReferralTaskId,
        mockUUID,
        caregiverArray,
        assignationType,
        mockOrganizationNihii11
      );
      expect(response).toEqual(mockResponse);
    });
  });

  describe('assignOrganization', () => {
    it('should call api.assignOrganizationToPrescription with organization resource', async () => {
      const mockOrg: AssignOrganizationResource = { nihii: 'ORG-1234', institutionTypeCode: '456' };
      mockApi.assignOrganizationToPrescription.mockReturnValue(of({}) as any);

      await firstValueFrom(service.assignOrganization(mockPrescriptionId, mockReferralTaskId, mockOrg, mockUUID));

      expect(mockApi.assignOrganizationToPrescription).toHaveBeenCalledWith(
        mockPrescriptionId,
        mockReferralTaskId,
        mockUUID,
        mockOrg
      );
    });
  });

  describe('transferAssignation', () => {
    it('should forward transfer details to api.transferAssignationToPrescription', async () => {
      const mockCaregiver: AssignCareGiverResource = { ssin: 'SSIN-1', role: Role.Caregiver };
      mockApi.transferAssignationToPrescription.mockReturnValue(of({}) as any);

      await firstValueFrom(
        service.transferAssignation(
          mockPrescriptionId,
          mockReferralTaskId,
          mockPerformerTaskId,
          mockCaregiver,
          mockUUID
        )
      );

      expect(mockApi.transferAssignationToPrescription).toHaveBeenCalledWith(
        mockPrescriptionId,
        mockReferralTaskId,
        mockPerformerTaskId,
        mockUUID,
        mockCaregiver
      );
    });
  });

  describe('rejectAssignation', () => {
    it('should call api.rejectAssignationToPrescription with task and uuid', async () => {
      mockApi.rejectAssignationToPrescription.mockReturnValue(of({}) as any);

      await firstValueFrom(service.rejectAssignation(mockPrescriptionId, mockPerformerTaskId, mockUUID));

      expect(mockApi.rejectAssignationToPrescription).toHaveBeenCalledWith(
        mockPrescriptionId,
        mockPerformerTaskId,
        mockUUID
      );
    });
  });

  describe('completePrescription', () => {
    it('should map PrescriptionExecutionComplete to CompletePrescriptionResource before calling API', async () => {
      const executionFinish: PrescriptionExecutionComplete = {
        performerTaskId: mockPerformerTaskId,
        endDate: '2026-07-22',
      };

      mockApi.completePrescription.mockReturnValue(of({}) as any);

      await firstValueFrom(service.completePrescription(mockPrescriptionId, executionFinish, mockUUID));

      expect(mockApi.completePrescription).toHaveBeenCalledWith(mockPrescriptionId, mockUUID, {
        performerTaskId: mockPerformerTaskId,
        executionEndDate: '2026-07-22',
      });
    });
  });

  describe('closePrescription', () => {
    it('should delegate close request to api.closePrescription', async () => {
      mockApi.closePrescription.mockReturnValue(of({}) as any);

      await firstValueFrom(service.closePrescription(mockPrescriptionId, mockUUID));

      expect(mockApi.closePrescription).toHaveBeenCalledWith(mockPrescriptionId, mockUUID);
    });
  });
});

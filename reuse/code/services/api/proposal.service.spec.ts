  import { TestBed } from '@angular/core/testing';
  import { ProposalService } from './proposal.service';
  import {
    ProposalService as ApiProposalService,
    CreateRequestResource,
    AssignCareGiverResource,
    AssignOrganizationResource,
    ReasonResource,
  } from '@reuse/code/openapi';
  import { SearchPrescriptionCriteria } from '@reuse/code/interfaces';
  import { of } from 'rxjs';

  describe('ProposalService', () => {
    let service: ProposalService;
    let apiProposalServiceMock: any;

    beforeEach(() => {
      apiProposalServiceMock = {
        createProposal: jest.fn().mockReturnValue(of({})),
        getAllProposals: jest.fn().mockReturnValue(of([])),
        getProposal: jest.fn().mockReturnValue(of({})),
        assignCareGiverToProposal: jest.fn().mockReturnValue(of({})),
        assignOrganizationToProposal: jest.fn().mockReturnValue(of({})),
        transferAssignationToProposal: jest.fn().mockReturnValue(of({})),
        rejectAssignationToProposal: jest.fn().mockReturnValue(of({})),
        approveProposal: jest.fn().mockReturnValue(of({})),
        cancelProposal: jest.fn().mockReturnValue(of({})),
        rejectProposal: jest.fn().mockReturnValue(of({})),
        rejectProposalTask: jest.fn().mockReturnValue(of({})),
      };

      TestBed.configureTestingModule({
        providers: [
          ProposalService,
          { provide: ApiProposalService, useValue: apiProposalServiceMock },
        ],
      });

      service = TestBed.inject(ProposalService);
    });

   describe('create', () => {
      it('should call api.createProposal with correct parameters', () => {
        const mockRequestResource: CreateRequestResource = { id: '123' } as any;
        const generatedUUID = 'uuid-123';

        service.create(mockRequestResource, generatedUUID);

        expect(apiProposalServiceMock.createProposal).toHaveBeenCalledWith(
          generatedUUID,
          mockRequestResource
        );
        expect(apiProposalServiceMock.createProposal).toHaveBeenCalledTimes(1);
      });
    });

  describe('findAll', () => {
      it('should call api.getAllProposals with all criteria parameters', () => {
        const criteria: SearchPrescriptionCriteria = {
          patient: 'patient-123',
          requester: 'requester-456',
          performer: 'performer-789',
          historical: true,
        };
        const page = 0;
        const pageSize = 20;

        service.findAll(criteria, page, pageSize);

        expect(apiProposalServiceMock.getAllProposals).toHaveBeenCalledWith(
          'patient-123',
          'requester-456',
          'performer-789',
          true,
          page,
          pageSize
        );
      });

      it('should call api.getAllProposals with undefined criteria', () => {
        const page = 1;
        const pageSize = 50;

        service.findAll(undefined, page, pageSize);

        expect(apiProposalServiceMock.getAllProposals).toHaveBeenCalledWith(
          undefined,
          undefined,
          undefined,
          undefined,
          page,
          pageSize
        );
      });
    });

    describe('findOne', () => {
      it('should call api.getProposal with proposalId', () => {
        const proposalId = 'proposal-123';

        service.findOne(proposalId);

        expect(apiProposalServiceMock.getProposal).toHaveBeenCalledWith(proposalId);
      });
    });

     describe('assignCaregiver', () => {
      it('should call api.assignCareGiverToProposal with correct parameters', () => {
        const prescriptionId = 'prescriptionId';
        const referralTaskId = 'task-456';
        const caregiver: AssignCareGiverResource = { careGiverId: 'cg-789' } as any;
        const generatedUUID = 'uuid-123';

        service.assignCaregiver(prescriptionId, referralTaskId, caregiver, generatedUUID);

        expect(apiProposalServiceMock.assignCareGiverToProposal).toHaveBeenCalledWith(
          prescriptionId,
          referralTaskId,
          generatedUUID,
          caregiver
        );
      });

    });

   describe('assignOrganization', () => {
      it('should call api.assignOrganizationToProposal with correct parameters', () => {
        const prescriptionId = 'prescriptionId';
        const referralTaskId = 'task-456';
        const organization: AssignOrganizationResource = { organizationId: 'org-789' } as any;
        const generatedUUID = 'uuid-123';

        service.assignOrganization(prescriptionId, referralTaskId, organization, generatedUUID);

        expect(apiProposalServiceMock.assignOrganizationToProposal).toHaveBeenCalledWith(
          prescriptionId,
          referralTaskId,
          generatedUUID,
          organization
        );
      });
    });

    describe('transferAssignation', () => {
      it('should call api.transferAssignationToProposal with correct parameters', () => {
        const prescriptionId = 'prescriptionId';
        const referralTaskId = 'task-456';
        const performerTaskId = 'performer-789';
        const caregiver: AssignCareGiverResource = { careGiverId: 'cg-999' } as any;
        const generatedUUID = 'uuid-123';

        service.transferAssignation(
          prescriptionId,
          referralTaskId,
          performerTaskId,
          caregiver,
          generatedUUID
        );

        expect(apiProposalServiceMock.transferAssignationToProposal).toHaveBeenCalledWith(
          prescriptionId,
          referralTaskId,
          performerTaskId,
          generatedUUID,
          caregiver
        );
      });
    });

   describe('rejectAssignation', () => {
      it('should call api.rejectAssignationToProposal with correct parameters', () => {
        const prescriptionId = 'prescriptionId';
        const performerTaskId = 'performer-789';
        const generatedUUID = 'uuid-123';

        service.rejectAssignation(prescriptionId, performerTaskId, generatedUUID);

        expect(apiProposalServiceMock.rejectAssignationToProposal).toHaveBeenCalledWith(
          prescriptionId,
          performerTaskId,
          generatedUUID
        );
      });
    });

   describe('approveProposal', () => {
      it('should call api.approveProposal with correct parameters', () => {
        const proposalId = 'proposal-123';
        const reason: ReasonResource = { reason: 'Approved' } as any;
        const generatedUUID = 'uuid-123';

        service.approveProposal(proposalId, reason, generatedUUID);

        expect(apiProposalServiceMock.approveProposal).toHaveBeenCalledWith(
          proposalId,
          generatedUUID,
          reason
        );
      });

    });

    describe('cancelProposal', () => {
      it('should call api.cancelProposal with correct parameters', () => {
        const proposalId = 'proposal-123';
        const generatedUUID = 'uuid-123';

        service.cancelProposal(proposalId, generatedUUID);

        expect(apiProposalServiceMock.cancelProposal).toHaveBeenCalledWith(proposalId, generatedUUID);
      });
    });

    describe('rejectProposal', () => {
      it('should call api.rejectProposal with correct parameters', () => {
        const proposalId = 'proposal-123';
        const reason: ReasonResource = { reason: 'Rejected' } as any;
        const generatedUUID = 'uuid-123';

        service.rejectProposal(proposalId, reason, generatedUUID);

        expect(apiProposalServiceMock.rejectProposal).toHaveBeenCalledWith(
          proposalId,
          generatedUUID,
          reason
        );
      });
    });
  });

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProposalsState } from './proposals.state';
import { ProposalService } from '../../services/api/proposal.service';
import { LoadingStatus } from '../../interfaces';

describe('ProposalsState', () => {
  let proposalsState: ProposalsState;
  let proposalServiceMock: jest.Mocked<ProposalService>;

  beforeEach(() => {
    proposalServiceMock = {
      findAll: jest.fn(),
    } as unknown as jest.Mocked<ProposalService>;

    TestBed.configureTestingModule({
      providers: [ProposalsState, { provide: ProposalService, useValue: proposalServiceMock }],
    });

    proposalsState = TestBed.inject(ProposalsState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadProposals - page calculation', () => {
    it('should keep the current page when rawPatientSsin is unchanged and no explicit page is given', () => {
      proposalServiceMock.findAll.mockReturnValue(of({}));
      jest.spyOn(proposalsState, 'state').mockReturnValue({
        status: LoadingStatus.SUCCESS,
        params: { page: 3, pageSize: 10, rawPatientSsin: '12345' },
      });

      proposalsState.loadProposals(undefined, undefined, undefined, '12345');

      expect(proposalServiceMock.findAll).toHaveBeenCalledWith(undefined, 3, 10);
    });

    it('should reset to page 1 when rawPatientSsin changes', () => {
      proposalServiceMock.findAll.mockReturnValue(of({}));
      jest.spyOn(proposalsState, 'state').mockReturnValue({
        status: LoadingStatus.SUCCESS,
        params: { page: 3, pageSize: 10, rawPatientSsin: '12345' },
      });

      proposalsState.loadProposals(undefined, undefined, undefined, '99999');

      expect(proposalServiceMock.findAll).toHaveBeenCalledWith(undefined, 1, 10);
    });

    it('should use the explicit page regardless of rawPatientSsin', () => {
      proposalServiceMock.findAll.mockReturnValue(of({}));
      jest.spyOn(proposalsState, 'state').mockReturnValue({
        status: LoadingStatus.SUCCESS,
        params: { page: 3, pageSize: 10, rawPatientSsin: '12345' },
      });

      proposalsState.loadProposals(undefined, 2, undefined, '12345');

      expect(proposalServiceMock.findAll).toHaveBeenCalledWith(undefined, 2, 10);
    });

    it('should reset to page 1 when rawPatientSsin is undefined', () => {
      proposalServiceMock.findAll.mockReturnValue(of({}));
      jest.spyOn(proposalsState, 'state').mockReturnValue({
        status: LoadingStatus.SUCCESS,
        params: { page: 3, pageSize: 10, rawPatientSsin: '12345' },
      });

      proposalsState.loadProposals(undefined, undefined, undefined, undefined);

      expect(proposalServiceMock.findAll).toHaveBeenCalledWith(undefined, 1, 10);
    });
  });
});

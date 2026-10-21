import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AccessMatrixState, Permissions } from './access-matrix.state';
import { AccessMatrixService } from '../../services/api/access-matrix.service';
import { LoadingStatus } from '../../interfaces';
import { AccessMatrix } from '@reuse/code/openapi';
import DoneCallback = jest.DoneCallback;

describe('AccessMatrixState', () => {
  let accessMatrixState: AccessMatrixState;
  let accessMatrixServiceMock: jest.Mocked<AccessMatrixService>;

  beforeEach(() => {
    // Create a mock for AccessMatrixService
    accessMatrixServiceMock = {
      getMatrix: jest.fn(),
    } as unknown as jest.Mocked<AccessMatrixService>;

    // Set up the test bed
    TestBed.configureTestingModule({
      providers: [AccessMatrixState, { provide: AccessMatrixService, useValue: accessMatrixServiceMock }],
    });

    // Get an instance of the service
    accessMatrixState = TestBed.inject(AccessMatrixState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call the service to load the access matrix and return the data', (done: DoneCallback) => {
    const mockAccessMatrix: AccessMatrix[] = [
      { templateName: 'template1', createPrescription: true } as AccessMatrix,
      { templateName: 'template2', createPrescription: false } as AccessMatrix,
    ];

    accessMatrixServiceMock.getMatrix.mockReturnValue(of(mockAccessMatrix));
    const getMatrixSpy = jest.spyOn(accessMatrixServiceMock, 'getMatrix');

    accessMatrixState.loadAccessMatrix().subscribe(result => {
      expect(result).toEqual(mockAccessMatrix);
      expect(getMatrixSpy).toHaveBeenCalled();
      done();
    });
  });

  it.each([
    {
      description: 'returns true if the matrix has at least one permission for the given template',
      permissions: ['createPrescription' as Permissions],
      templateCode: 'template1',
      expected: true,
    },
    {
      description: 'returns false if the matrix does not have the given permission for the template',
      permissions: ['createProposal' as Permissions],
      templateCode: 'template1',
      expected: false,
    },
    {
      description: 'returns false if no matrix matches the templateCode',
      permissions: ['createPrescription' as Permissions],
      templateCode: 'template3',
      expected: false,
    },
  ])('should $description', ({ permissions, templateCode, expected }) => {
    const mockMatrices: AccessMatrix[] = [
      { templateName: 'template1', createPrescription: true } as AccessMatrix,
      { templateName: 'template2', createPrescription: false } as AccessMatrix,
    ];

    jest.spyOn(accessMatrixState, 'state').mockReturnValue({ data: mockMatrices, status: LoadingStatus.SUCCESS });

    const result = accessMatrixState.hasAtLeastOnePermission(permissions, templateCode);

    expect(result).toBe(expected);
  });

  it('should return true if at least one permission exists for any template', () => {
    const permissions: string[] = ['createPrescription'];
    const mockMatrices: AccessMatrix[] = [
      { templateName: 'template1', createPrescription: true } as AccessMatrix,
      { templateName: 'template2', createProposal: false } as AccessMatrix,
    ];

    jest.spyOn(accessMatrixState, 'state').mockReturnValue({ data: mockMatrices, status: LoadingStatus.SUCCESS });

    const result = accessMatrixState.hasAtLeastOnePermissionForAnyTemplate(permissions);

    expect(result).toBe(true);
  });

  it('should return false if no permission exists for any template', () => {
    const permissions: string[] = ['createProposal'];
    const mockMatrices: AccessMatrix[] = [
      { templateName: 'template1', createPrescription: false } as AccessMatrix,
      { templateName: 'template2', createPrescription: false } as AccessMatrix,
    ];

    jest.spyOn(accessMatrixState, 'state').mockReturnValue({ data: mockMatrices, status: LoadingStatus.SUCCESS });

    const result = accessMatrixState.hasAtLeastOnePermissionForAnyTemplate(permissions);

    expect(result).toBe(false);
  });
});

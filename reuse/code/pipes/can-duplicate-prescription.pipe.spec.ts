import { CanDuplicatePrescriptionPipe } from './can-duplicate-prescription.pipe';
import { AccessMatrixState } from '../states/access-matrix.state';
import { Role } from '../interfaces';

describe('CanDuplicatePrescriptionPipe', () => {
  let pipe: CanDuplicatePrescriptionPipe;
  let mockAccessMatrixState: jest.Mocked<AccessMatrixState>;

  beforeEach(() => {
    mockAccessMatrixState = {
      hasAtLeastOnePermission: jest.fn(),
    } as unknown as jest.Mocked<AccessMatrixState>;

    pipe = new CanDuplicatePrescriptionPipe(mockAccessMatrixState as unknown as AccessMatrixState);
  });

  it('should return false if currentUser is undefined', () => {
    const prescription = { templateCode: 'template1', intent: 'order' } as any;
    const result = pipe.transform(prescription, undefined);
    expect(result).toBe(false);
  });

  it('should return false if currentUser is not a professional', () => {
    const prescription = { templateCode: 'template1', intent: 'order' } as any;
    const currentUser = { role: Role.patient } as any;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if accessMatrixState hasAtLeastOnePermission returns false', () => {
    const prescription = { templateCode: 'template1', intent: 'order' } as any;
    const currentUser = { role: Role.professional } as any;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(false);

    const result = pipe.transform(prescription, currentUser);
    expect(result).toBe(false);
  });

  it('should return false if prescription intent is "proposal"', () => {
    const prescription = { templateCode: 'template1', intent: 'proposal' } as any;
    const currentUser = { role: Role.professional } as any;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, currentUser);
    expect(result).toBe(false);
  });

  it('should return true if all conditions are satisfied', () => {
    const prescription = { templateCode: 'template1', intent: 'order' } as any;
    const currentUser = { role: Role.professional } as any;
    mockAccessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform(prescription, currentUser);
    expect(result).toBe(true);
  });
});

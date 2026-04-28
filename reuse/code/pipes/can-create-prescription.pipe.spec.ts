import { CanCreatePrescriptionPipe } from './can-create-prescription.pipe';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';

describe('CanCreatePrescriptionPipe', () => {
  let accessMatrixState: jest.Mocked<AccessMatrixState>;
  let pipe: CanCreatePrescriptionPipe;

  beforeEach(() => {
    accessMatrixState = {
      hasAtLeastOnePermission: jest.fn(),
    } as unknown as jest.Mocked<AccessMatrixState>;

    pipe = new CanCreatePrescriptionPipe(accessMatrixState);
  });

  it('should call hasAtLeastOnePermission with correct arguments', () => {
    accessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    pipe.transform('TEMPLATE_1');

    expect(accessMatrixState.hasAtLeastOnePermission).toHaveBeenCalledWith(['createPrescription'], 'TEMPLATE_1');
  });

  it('should return true when permission exists', () => {
    accessMatrixState.hasAtLeastOnePermission.mockReturnValue(true);

    const result = pipe.transform('TEMPLATE_1');

    expect(result).toBe(true);
  });

  it('should return false when permission does not exist', () => {
    accessMatrixState.hasAtLeastOnePermission.mockReturnValue(false);

    const result = pipe.transform('TEMPLATE_2');

    expect(result).toBe(false);
  });
});

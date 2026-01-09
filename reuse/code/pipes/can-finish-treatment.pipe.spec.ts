import { CanFinishTreatmentPipe } from './can-finish-treatment.pipe';
import { FhirR4TaskStatus, PerformerTaskResource, ReadRequestResource } from '@reuse/code/openapi';

describe('CanFinishTreatmentPipe', () => {
  let pipe: CanFinishTreatmentPipe;
  let accessMatrixStateMock: { hasAtLeastOnePermission: jest.Mock };

  beforeEach(() => {
    accessMatrixStateMock = {
      hasAtLeastOnePermission: jest.fn()
    };

    pipe = new CanFinishTreatmentPipe(accessMatrixStateMock as any);
  });

  const prescription = {
    templateCode: 'templateCode'
  } as ReadRequestResource;

  it('should return true when permission is granted and task is InProgress', () => {
    accessMatrixStateMock.hasAtLeastOnePermission.mockReturnValue(true);

    const task = {
      status: FhirR4TaskStatus.Inprogress
    } as PerformerTaskResource;

    expect(pipe.transform(prescription, task)).toBe(true);
    expect(accessMatrixStateMock.hasAtLeastOnePermission)
      .toHaveBeenCalledWith(['executeTreatment'], 'templateCode');
  });

  it('should return false when permission is missing', () => {
    accessMatrixStateMock.hasAtLeastOnePermission.mockReturnValue(false);

    const task = { status: FhirR4TaskStatus.Inprogress } as PerformerTaskResource;

    expect(pipe.transform(prescription, task)).toBe(false);
  });

  it('should return false when task status is not InProgress', () => {
    accessMatrixStateMock.hasAtLeastOnePermission.mockReturnValue(true);

    const task = { status: FhirR4TaskStatus.Completed } as PerformerTaskResource;

    expect(pipe.transform(prescription, task)).toBe(false);
  });

  it('should return false when task has no status', () => {
    accessMatrixStateMock.hasAtLeastOnePermission.mockReturnValue(true);

    const task = { status: undefined } as PerformerTaskResource;

    expect(pipe.transform(prescription, task)).toBe(false);
  });
});

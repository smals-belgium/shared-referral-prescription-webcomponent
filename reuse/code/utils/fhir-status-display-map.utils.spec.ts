import { FhirR4TaskStatus } from '@reuse/code/openapi';
import {
  mapFhirTaskStatus,
  mapDisplayStatusToColor,
  taskStatusDisplayMap,
  DisplayStatus,
  DisplayColor,
} from './fhir-status-display-map.utils';

describe('TaskStatusUtil', () => {
  describe('mapFhirTaskStatus', () => {
    it.each([
      ['READY', 'assigned'],
      ['INPROGRESS', 'active'],
      ['ONHOLD', 'interrupted'],
      ['CANCELLED', 'canceled'],
      ['COMPLETED', 'inactive'],
    ] as [FhirR4TaskStatus, DisplayStatus][])('should map %s to %s', (fhirStatus, expectedDisplay) => {
      expect(mapFhirTaskStatus(fhirStatus)).toBe(expectedDisplay);
    });

    it.each([
      'DRAFT',
      'REQUESTED',
      'RECEIVED',
      'ACCEPTED',
      'REJECTED',
      'FAILED',
      'ENTEREDINERROR',
      'NULL',
    ] as FhirR4TaskStatus[])('should return undefined for %s', fhirStatus => {
      expect(mapFhirTaskStatus(fhirStatus)).toBeUndefined();
    });
  });

  describe('mapDisplayStatusToColor', () => {
    it.each([
      ['READY', 'mh-blue'],
      ['INPROGRESS', 'mh-green'],
      ['ONHOLD', 'mh-orange'],
      ['CANCELLED', 'mh-red'],
      ['COMPLETED', 'mh-black'],
    ] as [FhirR4TaskStatus, DisplayColor][])('should map %s to %s', (fhirStatus, expectedColor) => {
      expect(mapDisplayStatusToColor(fhirStatus)).toBe(expectedColor);
    });

    it('should return undefined for unmapped statuses', () => {
      expect(mapDisplayStatusToColor('DRAFT' as FhirR4TaskStatus)).toBeUndefined();
    });
  });

  describe('taskStatusDisplayMap', () => {
    it('should contain all FhirR4TaskStatus values', () => {
      const expectedStatuses: FhirR4TaskStatus[] = [
        'DRAFT',
        'REQUESTED',
        'RECEIVED',
        'ACCEPTED',
        'REJECTED',
        'READY',
        'INPROGRESS',
        'ONHOLD',
        'CANCELLED',
        'COMPLETED',
        'FAILED',
        'ENTEREDINERROR',
        'NULL',
      ];
      expect(Object.keys(taskStatusDisplayMap).sort()).toEqual(expectedStatuses.sort());
    });

    it('should have exactly 5 defined display statuses', () => {
      const definedStatuses = Object.values(taskStatusDisplayMap).filter(Boolean);
      expect(definedStatuses).toHaveLength(5);
    });
  });
});

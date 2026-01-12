import { RequestStatus } from '@reuse/code/openapi';
import { mapDisplayStatusToColor, DisplayColor } from './request-status-display-map.utils';

describe('TaskStatusUtil', () => {
  describe('mapDisplayStatusToColor', () => {
    it.each([
      ['DRAFT', 'mh-black'],
      ['PENDING', 'mh-black'],
      ['OPEN', 'mh-blue'],
      ['CANCELLED', 'mh-red'],
      ['EXPIRED', 'mh-red'],
      ['IN_PROGRESS', 'mh-green'],
      ['APPROVED', 'mh-green'],
      ['REJECTED', 'mh-red'],
      ['DONE', 'mh-black'],
      ['BLACKLISTED', 'mh-red'],
    ] as [RequestStatus, DisplayColor][])('should map %s to %s', (requestStatus, expectedColor) => {
      expect(mapDisplayStatusToColor(requestStatus)).toBe(expectedColor);
    });

    it('should display return mh-black when status in not known', () => {
      expect(mapDisplayStatusToColor('TESTSTATUS' as RequestStatus)).toBe('mh-black');
      expect(mapDisplayStatusToColor(undefined as unknown as RequestStatus)).toBe('mh-black');
    });
  });
});

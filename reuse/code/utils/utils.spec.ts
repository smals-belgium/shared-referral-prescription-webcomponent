import { getStatusClassFromMap } from './utils';
import { RequestStatus } from '../openapi';

describe('getStatusClassFromMap', () => {
  it('should return mh-red for error states', () => {
    expect(getStatusClassFromMap(RequestStatus.Blacklisted)).toBe('mh-red');
    expect(getStatusClassFromMap(RequestStatus.Cancelled)).toBe('mh-red');
    expect(getStatusClassFromMap(RequestStatus.Expired)).toBe('mh-red');
  });

  it('should return mh-orange for pending status', () => {
    expect(getStatusClassFromMap(RequestStatus.Pending)).toBe('mh-orange');
  });

  it('should return mh-blue for in progress status', () => {
    expect(getStatusClassFromMap(RequestStatus.InProgress)).toBe('mh-blue');
  });

  it('should return mh-green for done status', () => {
    expect(getStatusClassFromMap(RequestStatus.Done)).toBe('mh-green');
  });

  it('should return mh-black for undefined, unknown, null, draft and open status', () => {
    expect(getStatusClassFromMap(undefined)).toBe('mh-black');

    const unknownStatus = 'UNKNOWN_STATUS' as RequestStatus;
    expect(getStatusClassFromMap(unknownStatus)).toBe('mh-black');

    expect(getStatusClassFromMap(null as any)).toBe('mh-black');

    expect(getStatusClassFromMap(RequestStatus.Draft)).toBe('mh-black');
    expect(getStatusClassFromMap(RequestStatus.Open)).toBe('mh-black');
  });

  it('should return correct class for all defined StatusEnum values', () => {
    const expectedMappings = {
      [RequestStatus.Blacklisted]: 'mh-red',
      [RequestStatus.Cancelled]: 'mh-red',
      [RequestStatus.Expired]: 'mh-red',
      [RequestStatus.Pending]: 'mh-orange',
      [RequestStatus.InProgress]: 'mh-blue',
      [RequestStatus.Done]: 'mh-green',
      [RequestStatus.Draft]: 'mh-black',
      [RequestStatus.Open]: 'mh-black',
    };

    Object.entries(expectedMappings).forEach(([status, expectedClass]) => {
      expect(getStatusClassFromMap(status as RequestStatus)).toBe(expectedClass);
    });
  });
});

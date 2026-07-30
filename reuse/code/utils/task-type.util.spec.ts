import {
  asOrganizationTask,
  asPerformerTask,
  checkAndConvertToOrganizationTask,
  checkAndConvertToPerformerTask,
  getPerformerTaskFromOrganizationTask,
  isOrganizationTask,
  isPerformerTask,
  organizationTaskHasNoPerformerTask,
} from './task-type.util';
import { OrganizationTaskResource, PerformerTaskResource } from '@reuse/code/openapi';

const performerTask: PerformerTaskResource = {
  careGiverSsin: '10022500123',
  taskType: 'PerformerTaskResource',
  id: 'perfomerTask',
};
const organizationTask: OrganizationTaskResource = {
  organizationNihii: '10022500123',
  taskType: 'OrganizationTaskResource',
  id: 'organizationTask',
};
const orgWithPerformerTask: OrganizationTaskResource = {
  ...organizationTask,
  performerTasks: [performerTask],
  id: 'orgWithPerformerTask',
};
const orgWithEmptyPerformerTask: OrganizationTaskResource = {
  ...organizationTask,
  performerTasks: [],
  id: 'orgWithEmptyPerformerTask',
};
const notTypedTask: PerformerTaskResource = { careGiverSsin: '10022500123', id: 'notTypedTask' };

describe('TaskTypeUtils', () => {
  it('should check if isPerformerTask', () => {
    expect(isPerformerTask(performerTask)).toBe(true);
    expect(isPerformerTask(organizationTask)).toBe(false);
    expect(isPerformerTask(notTypedTask)).toBe(false);
  });

  it('should check if isOrganizationTask', () => {
    expect(isOrganizationTask(performerTask)).toBe(false);
    expect(isOrganizationTask(organizationTask)).toBe(true);
    expect(isOrganizationTask(notTypedTask)).toBe(false);
  });

  it('should check if organizationTask Has No PerformerTask', () => {
    expect(organizationTaskHasNoPerformerTask(organizationTask)).toBe(true);
    expect(organizationTaskHasNoPerformerTask(orgWithPerformerTask)).toBe(false);
    expect(organizationTaskHasNoPerformerTask(orgWithEmptyPerformerTask)).toBe(true);
  });

  it('should return PerformerTask From OrganizationTask', () => {
    expect(getPerformerTaskFromOrganizationTask(organizationTask)).toBe(undefined);
    expect(getPerformerTaskFromOrganizationTask(orgWithPerformerTask)).toEqual([performerTask]);
    expect(getPerformerTaskFromOrganizationTask(orgWithEmptyPerformerTask)).toEqual([]);
  });

  it('should return typed PerformerTask', () => {
    expect(isPerformerTask(asPerformerTask(performerTask))).toBe(true);
  });

  it('should return typed OrganizationTask', () => {
    expect(isOrganizationTask(asOrganizationTask(organizationTask))).toBe(true);
  });
  describe('checkAndConvertToPerformerTask', () => {
    it('should return undefined when task is undefined', () => {
      expect(checkAndConvertToPerformerTask(undefined)).toBeUndefined();
    });

    it('should return the task as PerformerTaskResource when taskType is PerformerTaskResource', () => {
      const result = checkAndConvertToPerformerTask(performerTask);
      expect(result).toBe(performerTask);
      expect(result?.taskType).toBe('PerformerTaskResource');
    });

    it('should return undefined when task is an OrganizationTaskResource', () => {
      expect(checkAndConvertToPerformerTask(organizationTask)).toBeUndefined();
    });

    it('should return undefined when task has no taskType set', () => {
      expect(checkAndConvertToPerformerTask(notTypedTask)).toBeUndefined();
    });
  });

  describe('checkAndConvertToOrganizationTask', () => {
    it('should return undefined when task is undefined', () => {
      expect(checkAndConvertToOrganizationTask(undefined)).toBeUndefined();
    });

    it('should return the task as OrganizationTaskResource when taskType is OrganizationTaskResource', () => {
      const result = checkAndConvertToOrganizationTask(organizationTask);
      expect(result).toBe(organizationTask);
      expect(result?.taskType).toBe('OrganizationTaskResource');
    });

    it('should return undefined when task is a PerformerTaskResource', () => {
      expect(checkAndConvertToOrganizationTask(performerTask)).toBeUndefined();
    });

    it('should return undefined when task has no taskType set', () => {
      expect(checkAndConvertToOrganizationTask(notTypedTask)).toBeUndefined();
    });
  });
});

import { OrganizationTaskResource, PerformerTaskResource, RequestTaskResource } from '@reuse/code/openapi';
import TaskTypeEnum = RequestTaskResource.TaskTypeEnum;

export function isPerformerTask(task: RequestTaskResource) {
  return task.taskType === TaskTypeEnum.PerformerTaskResource;
}

export function isOrganizationTask(task: RequestTaskResource) {
  return task.taskType === TaskTypeEnum.OrganizationTaskResource;
}

export function organizationTaskHasNoPerformerTask(task: RequestTaskResource) {
  const orgTask = asOrganizationTask(task);
  return !orgTask.performerTasks || orgTask.performerTasks.length <= 0;
}

export function getPerformerTaskFromOrganizationTask(task: OrganizationTaskResource) {
  return task.performerTasks;
}

export function asPerformerTask(task: RequestTaskResource) {
  return task as PerformerTaskResource;
}

export function asOrganizationTask(task: RequestTaskResource) {
  return task as OrganizationTaskResource;
}

export function checkAndConvertToPerformerTask(
  task: RequestTaskResource | undefined
): PerformerTaskResource | undefined {
  if (!task) return undefined;
  const isPerformer = isPerformerTask(task);

  if (isPerformer) {
    return asPerformerTask(task);
  } else {
    return undefined;
  }
}

export function checkAndConvertToOrganizationTask(
  task: RequestTaskResource | undefined
): OrganizationTaskResource | undefined {
  if (!task) return undefined;
  const isOrganization = isOrganizationTask(task);

  if (isOrganization) {
    return asOrganizationTask(task);
  } else {
    return undefined;
  }
}

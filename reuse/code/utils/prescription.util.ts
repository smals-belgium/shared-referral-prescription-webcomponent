import { PerformerTaskResource, ReadRequestResource } from '@reuse/code/openapi';

export function getAllPerformerTasksAsMap(
  prescription: ReadRequestResource
): Map<string, PerformerTaskResource[]> | undefined {
  if (!prescription.performerTasks) return undefined;
  return new Map(Object.entries(prescription.performerTasks));
}

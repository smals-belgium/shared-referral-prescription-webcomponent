import { inject, Injectable } from '@angular/core';
import { PrescriptionExecutionFinish, PrescriptionExecutionStart } from '@reuse/code/interfaces';
import { PeriodResource, PrescriptionService as ApiPrescriptionService } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private api = inject(ApiPrescriptionService);

  startExecution(performerTaskId: string, executionStart: PrescriptionExecutionStart, generatedUUID: string) {
    const periodResource: PeriodResource = {
      start: executionStart.startDate,
    };
    return this.api.startExecution(performerTaskId, generatedUUID, periodResource);
  }

  restartExecution(performerTaskId: string, generatedUUID: string) {
    return this.api.restartExecution(performerTaskId, generatedUUID);
  }

  finishExecution(performerTaskId: string, executionEnd: PrescriptionExecutionFinish, generatedUUID: string) {
    const periodResource: PeriodResource = {
      end: executionEnd.endDate,
    };

    return this.api.finishExecution(performerTaskId, generatedUUID, periodResource);
  }

  cancelExecution(performerTaskId: string, generatedUUID: string) {
    return this.api.cancelExecution(performerTaskId, generatedUUID);
  }

  interruptExecution(performerTaskId: string, generatedUUID: string) {
    return this.api.interruptExecution(performerTaskId, generatedUUID);
  }
}

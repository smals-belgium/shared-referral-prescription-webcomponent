import { CreatePrescriptionWebComponent } from './create-prescription.component';
import { Observable } from 'rxjs';
import { CreatePrescriptionRequest, LoadingStatus } from '@reuse/code/interfaces';

export class CreatePrescriptionExtendedWebComponent extends CreatePrescriptionWebComponent {

  toCreatePrescriptionRequestExtended(templateCode: string,
                                      responses: Record<string, any>,
                                      subject: string): Observable<CreatePrescriptionRequest> {
    return this.toCreatePrescriptionRequest(templateCode, responses, subject);
  }

  encryptFreeTextInResponsesExtended(templateCode: string, responses: Record<string, any>): Observable<Record<string, any>> {
    return this.encryptFreeTextInResponses(templateCode, responses);
  }

  handleCreateBulkResultExtended(results: { trackId: number; status: LoadingStatus; error?: any; }[]): void {
    return this.handleCreateBulkResult(results)
  }
}

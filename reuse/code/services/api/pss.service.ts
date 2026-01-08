import { inject, Injectable } from '@angular/core';
import { AutocompleteOption } from '@smals/vas-evaluation-form-ui-core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ControlRequest, PssService as ApiPssService } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class PssService {
  private api = inject(ApiPssService);
  private http = inject(HttpClient);

  public status$ = new BehaviorSubject<boolean>(false);

  getStatus() {
    return this.status$.getValue();
  }

  setStatus(status: boolean) {
    this.status$.next(status);
  }

  setPssSessionId(id: string) {
    sessionStorage.setItem('pssSessionId', id);
  }

  getPssSessionId() {
    return sessionStorage.getItem('pssSessionId');
  }

  geDefault(url: string, params: HttpParams): Observable<AutocompleteOption[]> {
    return this.http.get<AutocompleteOption[]>(url, { params });
  }

  getIndications(params: string[]) {
    return this.api.findAllIndicationsRadiology(params);
  }

  getIntentions(params: string) {
    return this.api.findAllProcedures(params);
  }

  getPssStatus() {
    return this.api.checkStatusRadiology();
  }

  getPssRecommendations(controlAnnex82Request: ControlRequest) {
    return this.api.control(controlAnnex82Request);
  }

  getPssRecommendationsByExchangeId(exchangeId: string) {
    return this.api.controlByPssExchangeId(exchangeId);
  }
}

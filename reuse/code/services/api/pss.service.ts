import { inject, Injectable } from '@angular/core';
import { AutocompleteOption } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  LanguageCode,
  PssService as ApiPssService,
  RequestIndicationsRadiology,
  SupportRequestRadiology,
} from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class PssService {
  private readonly api = inject(ApiPssService);
  private readonly http = inject(HttpClient);

  public status$ = new BehaviorSubject<boolean>(false);

  getStatus() {
    return this.status$.getValue();
  }

  setStatus(status: boolean) {
    this.status$.next(status);
  }

  getPssStatus() {
    return this.api.checkStatusRadiology();
  }

  geDefault(url: string, params: HttpParams): Observable<AutocompleteOption[]> {
    return this.http.get<AutocompleteOption[]>(url, { params });
  }

  getIndications(params: RequestIndicationsRadiology) {
    return this.api.findAllIndicationsRadiology(params);
  }

  getPssRecommendations(supportRequestRadiology: SupportRequestRadiology) {
    return this.api.getSupportRadiology(supportRequestRadiology);
  }
}

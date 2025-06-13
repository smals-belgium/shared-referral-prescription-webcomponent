import { Injectable } from "@angular/core";
import { AutocompleteOption } from "@smals/vas-evaluation-form-ui-core";
import { BehaviorSubject, Observable } from "rxjs";
import { HttpClient, HttpParams } from "@angular/common/http";
import { ControlAnnex82Request, ControlAnnex82Response } from "../interfaces/pss.interface";

@Injectable({providedIn: 'root'})
export class PssService {
  public status$ = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient
  ) {
  }

  getStatus() {
    return this.status$.getValue()
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
    return this.http.get<AutocompleteOption[]>(url, {params})
  }

  getIndications(url: string, params: HttpParams): Observable<{
    sessionId: string,
    indications: AutocompleteOption[]
  }> {
    return this.http.get<{ sessionId: string, indications: AutocompleteOption[] }>(url, {params});
  }

  getIntentions(url: string, params: HttpParams): Observable<{ intentions: AutocompleteOption[] }> {
    return this.http.get<{ intentions: AutocompleteOption[] }>(url, {params});
  }


  getPssStatus(): Observable<boolean> {
    return this.http.get<boolean>('/pss/status');
  }

  controlIndications(controlAnnex82Request: ControlAnnex82Request): Observable<ControlAnnex82Response> {
    return this.http.post<ControlAnnex82Response>('/pss/radiology/control', controlAnnex82Request);
  }
}

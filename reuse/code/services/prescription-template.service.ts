import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {FormTemplate} from '@smals/vas-evaluation-form-ui-core';
import {EvfTemplate} from '../interfaces';
import {HttpCacheService} from './http-cache.service';

@Injectable({providedIn: 'root'})
export class PrescriptionTemplateService {

  constructor(
    private cacheHttpService: HttpCacheService
  ) {
  }

  findAllTemplates(): Observable<EvfTemplate[]> {
    return this.cacheHttpService.get<EvfTemplate[]>('/templates');
  }

  findOneVersion(templateCode: string): Observable<FormTemplate> {
    return this.cacheHttpService.get<FormTemplate>(`/templates/${templateCode}/versions/latest`);
  }
}

import { inject, Injectable } from '@angular/core';
import { of, switchMap } from 'rxjs';
import { HttpCacheService } from '@reuse/code/services/cache/http-cache.service';
import { Template, TemplateService as ApiTemplateService, TemplateVersion } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class PrescriptionTemplateService {
  private api = inject(ApiTemplateService);

  constructor(private cacheHttpService: HttpCacheService) {}

  findAllTemplates() {
    const url = '/templates';

    return this.cacheHttpService.loadFromCache<Template[]>(url, 30).pipe(
      switchMap(cachedData => {
        if (cachedData) {
          return of(cachedData);
        }

        return this.api.findTemplates().pipe(switchMap(data => this.cacheHttpService.save(url, data)));
      })
    );
  }

  findOneVersion(templateCode: string) {
    const version = 'latest';
    const url = `/templates/${templateCode}/versions/${version}`;

    return this.cacheHttpService.loadFromCache<TemplateVersion>(url, 30).pipe(
      switchMap(cachedData => {
        if (cachedData) {
          return of(cachedData);
        }

        return this.api
          .findTemplateVersion(templateCode, version)
          .pipe(switchMap(data => this.cacheHttpService.save(url, data)));
      })
    );
  }
}

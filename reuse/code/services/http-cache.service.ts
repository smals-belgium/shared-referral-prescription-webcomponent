import { Injectable } from '@angular/core';
import { from, Observable, of, switchMap } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DateTime } from 'luxon';

@Injectable({providedIn: 'root'})
export class HttpCacheService {

  private readonly cacheName = 'healix-v1';

  constructor(
    private readonly http: HttpClient
  ) {
  }

  get<T>(url: string, params?: HttpParams, maxAge = 30): Observable<T> {
    url = params?.keys()?.length
      ? url + '?' + params.toString()
      : url;
    if (window.location.protocol === 'https') {
      return this.loadFromCache<T>(url, maxAge).pipe(
        switchMap((data) => data
          ? of(data)
          : this.http.get<T>(url).pipe(
            switchMap((data) => this.save(url, data))
          )
        )
      );
    } else {
      return this.http.get<T>(url);
    }
  }

  loadFromCache<T>(url: string, maxAge: number): Observable<T | null> {
    return from(this.loadAsync(url, maxAge));
  }

  private async loadAsync(url: string, maxAge: number): Promise<any> {
    if (!window.caches || !(await window.caches.has(this.cacheName))) {
      return null;
    }
    const cache = await window.caches.open(this.cacheName);
    const response = await cache.match(url);
    if (!response) {
      return null;
    }
    const cacheDate = response.headers.get('Date') as string;
    if (!cacheDate || DateTime.fromISO(cacheDate).diffNow('minutes').minutes < -maxAge) {
      return null;
    }
    return await response.json();
  }

  save<T>(url: string, data: T): Observable<T> {
    if (!window.caches) {
      return of(data);
    }
    const response = new Response(JSON.stringify(data), {status: 200, statusText: 'OK'});
    response.headers.append('Date', new Date().toJSON());
    return from(window.caches.open(this.cacheName))
      .pipe(
        tap((cache) => cache.put(url, response)),
        map(() => data)
      )
  }
}

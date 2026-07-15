import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { delay, of, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { MockStore } from '../mock/mock-store.service';
import { MockRequestContext } from '../mock/mock-types';
import { handleAuth } from '../mock/handlers/auth.handler';
import { handleMaster } from '../mock/handlers/master.handler';
import { handleRequests } from '../mock/handlers/requests.handler';
import { handleProjects } from '../mock/handlers/projects.handler';
import { handleTeams } from '../mock/handlers/teams.handler';

const handlers = [handleAuth, handleMaster, handleRequests, handleProjects, handleTeams];

/**
 * Stands in for a real backend. Never calls `next()`, so it short-circuits
 * before any real network/SSR fetch happens — safe on the server by
 * construction. Keep this registered last so auth/error interceptors still
 * wrap the synthetic response on its way back.
 */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMockApi || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const store = inject(MockStore);
  const platformId = inject(PLATFORM_ID);

  const rawPath = req.url.slice(environment.apiUrl.length) || '/';
  const [pathname, queryString] = rawPath.split('?');
  const segments = pathname.split('/').filter(Boolean);

  const ctx: MockRequestContext = {
    method: req.method,
    path: pathname,
    segments,
    query: new URLSearchParams(queryString ?? ''),
    body: req.body,
    store,
  };

  const result = handlers.reduce<ReturnType<(typeof handlers)[number]>>(
    (found, handle) => found ?? handle(ctx),
    undefined,
  ) ?? { status: 404, body: { message: `No mock handler for ${req.method} ${pathname}` } };

  const latency = isPlatformServer(platformId) ? 0 : 250 + Math.round(Math.random() * 200);

  if (result.status >= 200 && result.status < 300) {
    return of(new HttpResponse({ status: result.status, body: result.body, url: req.url })).pipe(delay(latency));
  }

  return throwError(
    () => new HttpErrorResponse({ status: result.status, error: result.body, url: req.url }),
  ).pipe(delay(latency));
};

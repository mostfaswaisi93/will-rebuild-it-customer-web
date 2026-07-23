import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { SessionStore } from '../session/session-store.service';
import { ToastService } from '../toast/toast.service';
import { NetworkStatusService } from '../network/network-status.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const session = inject(SessionStore);
  const toast = inject(ToastService);
  const network = inject(NetworkStatusService);

  const isApiCall = req.url.startsWith(environment.apiUrl);

  return next(req).pipe(
    tap((event) => {
      // Any successful API response proves the server is reachable again.
      if (isApiCall && event instanceof HttpResponse) {
        network.reportReachable();
      }
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && isApiCall) {
        if (error.status === 401) {
          session.clearSession();
          void router.navigate(['/pub/email-check/request']);
        } else if (error.status === 0) {
          // Status 0 means the request never reached the server at all —
          // offline, DNS failure, or a dropped connection. Telling someone on
          // a weak link that "something went wrong" is useless; naming the
          // cause tells them it is worth waiting and retrying.
          network.reportUnreachable();
          toast.danger('common.errorOffline');
        } else if (error.status >= 500) {
          toast.danger('common.errorServer');
        }
        // 4xx other than 401 is left to the calling page: it knows whether a
        // 404 means "no such project" or "this list is simply empty".
      }
      return throwError(() => error);
    }),
  );
};

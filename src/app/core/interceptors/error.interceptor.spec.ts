import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { catchError, firstValueFrom, of } from 'rxjs';
import { SessionStore } from '../session/session-store.service';
import { ToastService } from '../toast/toast.service';
import { NetworkStatusService } from '../network/network-status.service';
import { errorInterceptor } from './error.interceptor';

/**
 * Failure paths matter more here than in most apps: the platform targets weak,
 * intermittent connections, so these branches run often in the field. None of
 * them had any coverage before.
 */
describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let toast: ToastService;
  let session: SessionStore;
  let network: NetworkStatusService;
  let router: Router;

  const API_URL = '/api/projects';

  beforeEach(() => {
    localStorage.removeItem('grp-session');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
    session = TestBed.inject(SessionStore);
    network = TestBed.inject(NetworkStatusService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('grp-session');
  });

  /** Fires a request and swallows the rethrown error so specs can assert side effects. */
  function requestExpectingFailure(url = API_URL): Promise<unknown> {
    const promise = firstValueFrom(http.get(url).pipe(catchError((e) => of(e))));
    return promise;
  }

  it('signs the user out and redirects on 401', async () => {
    session.setSession({
      token: 't',
      user: {
        id: 'u1',
        role: 'beneficiary',
        firstName: 'Y',
        lastName: 'N',
        email: 'y@e.com',
        phone: '+970',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });
    expect(session.isAuthenticated()).toBeTrue();
    const navigateSpy = spyOn(router, 'navigate');

    const pending = requestExpectingFailure();
    httpMock.expectOne(API_URL).flush('nope', { status: 401, statusText: 'Unauthorized' });
    await pending;

    expect(session.isAuthenticated()).withContext('stale session must be cleared').toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/pub/email-check/request']);
  });

  it('reports offline and names the cause when the request never reaches the server', async () => {
    const dangerSpy = spyOn(toast, 'danger');
    expect(network.isOffline()).toBeFalse();

    const pending = requestExpectingFailure();
    // Status 0 is how a dropped connection surfaces.
    httpMock.expectOne(API_URL).error(new ProgressEvent('error'), { status: 0, statusText: '' });
    await pending;

    expect(network.isOffline()).withContext('banner must appear').toBeTrue();
    expect(dangerSpy).toHaveBeenCalledWith('common.errorOffline');
  });

  it('distinguishes a server failure from being offline', async () => {
    const dangerSpy = spyOn(toast, 'danger');

    const pending = requestExpectingFailure();
    httpMock.expectOne(API_URL).flush('boom', { status: 500, statusText: 'Server Error' });
    await pending;

    expect(dangerSpy).toHaveBeenCalledWith('common.errorServer');
    expect(network.isOffline())
      .withContext('a reachable-but-broken server is not "offline"')
      .toBeFalse();
  });

  it('clears the offline state once a request succeeds again', async () => {
    const firstCall = requestExpectingFailure();
    httpMock.expectOne(API_URL).error(new ProgressEvent('error'), { status: 0, statusText: '' });
    await firstCall;
    expect(network.isOffline()).toBeTrue();

    const secondCall = firstValueFrom(http.get(API_URL));
    httpMock.expectOne(API_URL).flush({ items: [] });
    await secondCall;

    expect(network.isOffline()).withContext('recovery must dismiss the banner').toBeFalse();
  });

  it('leaves 404 to the calling page instead of toasting', async () => {
    const dangerSpy = spyOn(toast, 'danger');

    const pending = requestExpectingFailure();
    httpMock.expectOne(API_URL).flush('missing', { status: 404, statusText: 'Not Found' });
    await pending;

    // A missing record is a page-level state ("no such project"), not a
    // global error worth interrupting the user over.
    expect(dangerSpy).not.toHaveBeenCalled();
  });

  it('ignores failures from non-API requests', async () => {
    const dangerSpy = spyOn(toast, 'danger');

    const pending = requestExpectingFailure('/i18n/en.json');
    httpMock.expectOne('/i18n/en.json').error(new ProgressEvent('error'), { status: 0, statusText: '' });
    await pending;

    expect(dangerSpy).not.toHaveBeenCalled();
    expect(network.isOffline()).toBeFalse();
  });
});

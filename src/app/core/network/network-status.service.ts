import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * App-wide connectivity state.
 *
 * This platform is built for people on weak and intermittent connections, so
 * "the network dropped" and "the server failed" need to be told apart: the
 * first is usually recoverable by waiting, the second is not, and telling
 * someone to retry when their connection is gone is useless advice.
 *
 * `navigator.onLine` is a floor, not a guarantee — it reports link-layer
 * connectivity, so it can be `true` on a connection that cannot actually reach
 * the server. `reportUnreachable()` lets the HTTP layer report a real failed
 * request, which is stronger evidence than the browser flag.
 */
@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Link-layer state, per the browser. */
  private readonly browserOnline = signal(
    this.isBrowser && typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  /** Set when a request actually failed to reach the server, cleared on success. */
  private readonly serverUnreachable = signal(false);

  readonly isOffline = computed(() => !this.browserOnline() || this.serverUnreachable());

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    const goOnline = (): void => {
      this.browserOnline.set(true);
      // The link is back; give the server the benefit of the doubt again so a
      // stale failure does not pin the banner open.
      this.serverUnreachable.set(false);
    };
    const goOffline = (): void => this.browserOnline.set(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    });
  }

  /** Called by the HTTP error interceptor when a request never reached the server. */
  reportUnreachable(): void {
    this.serverUnreachable.set(true);
  }

  /** Called when any request succeeds, which proves the server is reachable again. */
  reportReachable(): void {
    if (this.serverUnreachable()) {
      this.serverUnreachable.set(false);
    }
  }
}

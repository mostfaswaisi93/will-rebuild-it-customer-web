import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionStore } from '@core/session/session-store.service';
import { Spinner } from '@shared/ui/loader/spinner';
import { roleHomeRoute } from '../role-redirect.util';

/**
 * Thin redirect handler mounted at `/auth/callback`. This app's actual
 * working sign-in path is `EmailCheck` (`/pub/email-check/:ctx`), which sets
 * the session directly — this route carries no real logic of its own, it
 * exists only as the seam for a future real SSO/OAuth callback integration
 * so the URL/architecture matches the target spec.
 */
@Component({
  selector: 'app-auth-callback',
  imports: [Spinner],
  templateUrl: './callback.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCallback implements OnInit {
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const role = this.sessionStore.role();
    if (this.sessionStore.isAuthenticated() && role) {
      void this.router.navigateByUrl(roleHomeRoute(role));
    } else {
      void this.router.navigateByUrl('/pub/email-check/request');
    }
  }
}

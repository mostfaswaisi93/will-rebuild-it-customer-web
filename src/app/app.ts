import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';
import { TranslatePipe } from '@core/i18n/translate.pipe';

/** Every page renders inside a `<main id="main-content">` landmark. */
const MAIN_CONTENT_ID = 'main-content';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        // Skip the initial navigation: on a cold load the browser already puts
        // the user at the top of a fresh document, and stealing focus there
        // would fight the browser's own behaviour.
        skip(1),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.focusMainContent());
  }

  /**
   * Moves focus to the main landmark. Without this, a router navigation leaves
   * focus on the link that was clicked (or on `<body>` once that link is
   * destroyed), so keyboard and screen-reader users stay stranded in the old
   * page's chrome while the visible content changes underneath them.
   */
  protected focusMainContent(): void {
    if (!this.isBrowser) {
      return;
    }
    // Deferred a tick: NavigationEnd fires before the newly activated
    // component has been rendered, so the target may not exist yet.
    setTimeout(() => {
      const main = document.getElementById(MAIN_CONTENT_ID);
      // `preventScroll` so focusing does not fight the router's own scroll
      // position restoration.
      main?.focus({ preventScroll: true });
    });
  }
}

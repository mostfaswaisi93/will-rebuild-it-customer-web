import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideWifiOff } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { NetworkStatusService } from '@core/network/network-status.service';

/**
 * Tells the user plainly when the app has lost contact with the server.
 *
 * The platform targets intermittent, low-bandwidth connections, where a failed
 * request is routine rather than exceptional. Without this, a page that quietly
 * stops updating is indistinguishable from a page with nothing to show — and a
 * beneficiary waiting on news about their home deserves to know which it is.
 *
 * `role="status"` (polite) rather than `alert`: losing signal is not an
 * emergency, and it should not interrupt whatever a screen reader is saying.
 */
@Component({
  selector: 'app-offline-banner',
  imports: [LucideWifiOff, TranslatePipe],
  template: `
    @if (network.isOffline()) {
      <div
        role="status"
        class="flex items-center justify-center gap-2 bg-ink-700 px-4 py-1.5 text-center text-xs text-white"
      >
        <svg lucideWifiOff [size]="14" class="shrink-0"></svg>
        <span>{{ 'a11y.offlineNotice' | translate }}</span>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineBanner {
  protected readonly network = inject(NetworkStatusService);
}

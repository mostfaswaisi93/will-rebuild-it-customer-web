import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideInfo } from '@lucide/angular';
import { environment } from '@env/environment';
import { TranslatePipe } from '@core/i18n/translate.pipe';

/**
 * Labels the app as running on sample data whenever the mock backend is
 * active.
 *
 * This is a matter of integrity rather than developer convenience: the app
 * presents named families, damage reports, funding totals and completed-rebuild
 * counts that read as real records of real people. Anyone shown this build
 * without that context could reasonably believe those families and those funds
 * exist. The banner says plainly that they do not.
 *
 * It also makes the mock backend impossible to ship to production unnoticed —
 * the moment `environment.useMockApi` is false, this renders nothing.
 */
@Component({
  selector: 'app-demo-banner',
  imports: [LucideInfo, TranslatePipe],
  template: `
    @if (isDemo) {
      <div
        role="note"
        class="flex items-center justify-center gap-2 bg-sand-100 px-4 py-1.5 text-center text-xs text-sand-700"
      >
        <svg lucideInfo [size]="14" class="shrink-0"></svg>
        <span>{{ 'a11y.demoData' | translate }}</span>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoBanner {
  protected readonly isDemo = environment.useMockApi;
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideHammer } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { PageHeader } from '@shared/ui/page-header/page-header';

/**
 * Shared stub for every domain deferred to a follow-up phase (Estimates,
 * Funding, Donations, Support, Complaints, Account, Notifications, content
 * pages, request wizards). Keeps every route in the target spec navigable
 * now, honestly, instead of a 404 or a half-built feature.
 */
@Component({
  selector: 'app-coming-soon',
  imports: [LucideHammer, TranslatePipe, PageHeader],
  templateUrl: './coming-soon.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComingSoon {
  readonly titleKey = input<string>('common.comingSoon');
}

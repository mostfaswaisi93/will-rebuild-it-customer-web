import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideGlobe } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { BrandMark } from '@shared/ui/brand-mark/brand-mark';

/**
 * Lightweight top nav for every public (`/pub/*`) page — these pages are
 * deliberately NOT wrapped in the authenticated app shell (no sidebar), so
 * each public page imports this directly instead of relying on a shared
 * layout route.
 */
@Component({
  selector: 'app-public-nav',
  imports: [RouterLink, LucideGlobe, TranslatePipe, BrandMark],
  templateUrl: './public-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicNav {
  protected readonly i18n = inject(TranslationService);

  protected toggleLocale(): void {
    this.i18n.toggleLocale();
  }
}

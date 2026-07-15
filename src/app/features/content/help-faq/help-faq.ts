import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LucideChevronDown, LucideMail, LucidePhone } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { MasterApi } from '@core/api/master-api.service';
import { GlobalSettings } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Spinner } from '@shared/ui/loader/spinner';

interface FaqEntry {
  readonly questionKey: string;
  readonly answerKey: string;
}

/**
 * Help & FAQ page mounted at `/app/help`. Renders a fixed set of
 * reconstruction-platform FAQs as native disclosure accordions, followed by
 * the support contact details from `MasterApi.getGlobalSettings`.
 */
@Component({
  selector: 'app-help-faq',
  imports: [LucideChevronDown, LucideMail, LucidePhone, TranslatePipe, PageHeader, Spinner],
  templateUrl: './help-faq.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpFaq {
  private readonly masterApi = inject(MasterApi);

  protected readonly faqs: readonly FaqEntry[] = [
    { questionKey: 'content.help.faq.q1', answerKey: 'content.help.faq.a1' },
    { questionKey: 'content.help.faq.q2', answerKey: 'content.help.faq.a2' },
    { questionKey: 'content.help.faq.q3', answerKey: 'content.help.faq.a3' },
    { questionKey: 'content.help.faq.q4', answerKey: 'content.help.faq.a4' },
    { questionKey: 'content.help.faq.q5', answerKey: 'content.help.faq.a5' },
    { questionKey: 'content.help.faq.q6', answerKey: 'content.help.faq.a6' },
  ];

  protected readonly settings = signal<GlobalSettings | null>(null);
  protected readonly isLoading = signal(true);

  constructor() {
    this.masterApi.getGlobalSettings().subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}

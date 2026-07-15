import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { MasterApi } from '@core/api/master-api.service';
import { GlobalSettings } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Spinner } from '@shared/ui/loader/spinner';

/**
 * Static terms-of-service page mounted at `/app/terms`. The body is
 * authored server-side and delivered through `MasterApi.getGlobalSettings`,
 * then rendered as sanitized rich text.
 */
@Component({
  selector: 'app-terms',
  imports: [TranslatePipe, PageHeader, Spinner],
  templateUrl: './terms.html',
  styleUrl: './terms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Terms {
  private readonly masterApi = inject(MasterApi);

  protected readonly settings = signal<GlobalSettings | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);

  constructor() {
    this.load();
  }

  protected retry(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.masterApi.getGlobalSettings().subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }
}

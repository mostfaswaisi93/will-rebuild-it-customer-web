import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { LucideBan, LucideCircleCheck, LucideExternalLink, LucideRotateCcw } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { FundingApi } from '@core/api/funding-api.service';
import { Disbursement } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { SpinnerOverlay } from '@shared/ui/loader/spinner-overlay';

type DisbursementMode = 'normal' | 'voided' | 'refunded';

/**
 * `/app/funding/:fundingId/txn/:txnId` — a single disbursement (transaction)
 * within a funding record. The header banner adapts its tone and label to the
 * disbursement's state: normal, voided, or refunded.
 */
@Component({
  selector: 'app-disbursement-details',
  imports: [
    TranslatePipe,
    PageHeader,
    SpinnerOverlay,
    LucideBan,
    LucideCircleCheck,
    LucideExternalLink,
    LucideRotateCcw,
  ],
  templateUrl: './disbursement-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisbursementDetails {
  private readonly fundingApi = inject(FundingApi);

  readonly fundingId = input.required<string>();
  readonly txnId = input.required<string>();

  protected readonly disbursement = signal<Disbursement | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadError = signal(false);

  protected readonly mode = computed<DisbursementMode>(() => {
    const d = this.disbursement();
    if (!d) {
      return 'normal';
    }
    if (d.isVoided) {
      return 'voided';
    }
    if (d.isRefunded) {
      return 'refunded';
    }
    return 'normal';
  });

  constructor() {
    effect(() => {
      this.fetchDisbursement(this.fundingId(), this.txnId());
    });
  }

  protected retry(): void {
    this.fetchDisbursement(this.fundingId(), this.txnId());
  }

  /** Raw ISO substring date formatting only — no shared date pipe exists yet. */
  protected formatDate(iso: string): string {
    return iso.slice(0, 10);
  }

  private fetchDisbursement(fundingId: string, txnId: string): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.fundingApi.getDisbursement(fundingId, txnId).subscribe({
      next: (result) => {
        this.disbursement.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.disbursement.set(null);
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }
}

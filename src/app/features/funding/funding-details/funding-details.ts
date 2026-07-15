import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideBuilding2,
  LucideCircleAlert,
  LucideCircleCheck,
  LucideExternalLink,
  LucidePenLine,
  LucideReceipt,
  LucideRotateCcw,
  LucideUsers,
  LucideWallet,
} from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { FundingApi } from '@core/api/funding-api.service';
import { Funding } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';
import { QrCode } from '@shared/ui/qr-code/qr-code';
import { SpinnerOverlay } from '@shared/ui/loader/spinner-overlay';

/**
 * `/app/funding/:fundingId` — a single funding record for one of the
 * beneficiary's projects: team/project context, summary + QR of the funding
 * number, the disbursement ledger, the funded / outstanding / refunded
 * breakdown, and (until confirmed) the receipt-confirmation call to action.
 */
@Component({
  selector: 'app-funding-details',
  imports: [
    RouterLink,
    TranslatePipe,
    PageHeader,
    StatusPill,
    QrCode,
    SpinnerOverlay,
    LucideBuilding2,
    LucideCircleAlert,
    LucideCircleCheck,
    LucideExternalLink,
    LucidePenLine,
    LucideReceipt,
    LucideRotateCcw,
    LucideUsers,
    LucideWallet,
  ],
  templateUrl: './funding-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FundingDetails {
  private readonly fundingApi = inject(FundingApi);

  readonly fundingId = input.required<string>();

  protected readonly funding = signal<Funding | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadError = signal(false);

  protected readonly termsAccepted = signal(false);

  protected readonly headerTitle = computed(() => this.funding()?.fundingNumber ?? this.fundingId());

  /** Navigation is gated on the terms checkbox — `null` disables the link. */
  protected readonly signLink = computed<string[] | null>(() =>
    this.termsAccepted() ? ['/app/funding', this.fundingId(), 'sign'] : null,
  );

  constructor() {
    effect(() => {
      this.fetchFunding(this.fundingId());
    });
  }

  protected retry(): void {
    this.fetchFunding(this.fundingId());
  }

  protected onTermsToggle(event: Event): void {
    this.termsAccepted.set((event.target as HTMLInputElement).checked);
  }

  /** Raw ISO substring date formatting only — no shared date pipe exists yet. */
  protected formatDate(iso: string): string {
    return iso.slice(0, 10);
  }

  private fetchFunding(id: string): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.termsAccepted.set(false);
    this.fundingApi.getFundingDetails(id).subscribe({
      next: (result) => {
        this.funding.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.funding.set(null);
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }
}

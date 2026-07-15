import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDownload } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { DonationsApi } from '@core/api/donations-api.service';
import { Donation } from '@core/models';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';
import { SpinnerOverlay } from '@shared/ui/loader/spinner-overlay';
import { QrCode } from '@shared/ui/qr-code/qr-code';

/**
 * `/app/donations/:donationId` — a single donation's receipt view. The
 * "download receipt" action is a placeholder toast for now; real PDF receipt
 * generation is deferred to a later phase.
 */
@Component({
  selector: 'app-donation-detail',
  imports: [RouterLink, TranslatePipe, PageHeader, StatusPill, SpinnerOverlay, QrCode, LucideDownload],
  templateUrl: './donation-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonationDetail {
  private readonly donationsApi = inject(DonationsApi);
  private readonly toastService = inject(ToastService);

  readonly donationId = input.required<string>();

  protected readonly donation = signal<Donation | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadError = signal(false);

  protected readonly amountLabel = computed(() => {
    const donation = this.donation();
    return donation ? '$' + donation.amount.toLocaleString('en-US') : '';
  });

  constructor() {
    effect(() => {
      this.fetchDonation(this.donationId());
    });
  }

  protected retry(): void {
    this.fetchDonation(this.donationId());
  }

  protected downloadReceipt(): void {
    // Placeholder — real PDF receipt generation is deferred to a later phase.
    this.toastService.success('donations.detail.receiptComingSoon');
  }

  protected formatDate(iso: string): string {
    return iso.slice(0, 10);
  }

  private fetchDonation(id: string): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.donationsApi.getDonationDetails(id).subscribe({
      next: (result) => {
        this.donation.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.donation.set(null);
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }
}

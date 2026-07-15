import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideHandHeart, LucidePlus, LucideReceipt } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { DonationsApi } from '@core/api/donations-api.service';
import { DONATION_STATUSES, Donation, DonationStatus } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Paginator } from '@shared/ui/paginator/paginator';
import { StatusPill } from '@shared/ui/status-pill/status-pill';
import { ImpactCard } from '@shared/ui/impact-card/impact-card';

/**
 * `/app/donations` — the donor dashboard. A summary row of impact tiles over
 * a hand-rolled responsive card list of the donor's own donations.
 *
 * The impact tiles summarise the currently-loaded page of donations; the
 * "donations" count uses the server's real `totalCount`. There is no
 * aggregate endpoint yet, so a full lifetime total is deferred.
 */
@Component({
  selector: 'app-donations-list',
  imports: [RouterLink, TranslatePipe, PageHeader, Paginator, StatusPill, ImpactCard, LucideHandHeart, LucidePlus, LucideReceipt],
  templateUrl: './donations-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonationsList {
  private readonly donationsApi = inject(DonationsApi);

  protected readonly items = signal<Donation[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(false);
  protected readonly pageNo = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly status = signal<DonationStatus | ''>('');

  protected readonly statusOptions = DONATION_STATUSES;
  protected readonly skeletonRows: readonly number[] = [0, 1, 2, 3];

  /** Sum of the amounts on the currently-loaded page. */
  protected readonly totalDonated = computed(() =>
    this.items().reduce((sum, donation) => sum + donation.amount, 0),
  );

  /** Distinct supported projects on the currently-loaded page. */
  protected readonly projectsSupported = computed(() => {
    const projectIds = new Set<string>();
    for (const donation of this.items()) {
      if (donation.projectId) {
        projectIds.add(donation.projectId);
      }
    }
    return projectIds.size;
  });

  private isFirstFilterRun = true;

  constructor() {
    // A status change should snap back to page 1 (skip the initial no-op run).
    effect(() => {
      this.status();
      if (this.isFirstFilterRun) {
        this.isFirstFilterRun = false;
        return;
      }
      this.pageNo.set(1);
    });

    effect(() => {
      const filters = {
        pageNo: this.pageNo(),
        pageSize: this.pageSize(),
        status: this.status() || undefined,
      };
      this.loading.set(true);
      this.donationsApi.getMyDonations(filters).subscribe({
        next: (result) => {
          this.items.set(result.items);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  protected onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.status.set(value as DonationStatus | '');
  }

  protected formatMoney(amount: number): string {
    return '$' + amount.toLocaleString('en-US');
  }

  /** Raw ISO substring date formatting only — no shared date pipe exists yet. */
  protected formatDate(iso: string): string {
    return iso.slice(0, 10);
  }
}

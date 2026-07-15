import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { FundingApi } from '@core/api/funding-api.service';
import { FUNDING_STATUSES, Funding, FundingStatus } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { Paginator } from '@shared/ui/paginator/paginator';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/**
 * "My funding" list — every funding record tied to the current beneficiary's
 * projects. Hand-rolled responsive table/cards (not the generic `DataTable`)
 * so a `StatusPill` and a routed funding-number link can live inside cells.
 */
@Component({
  selector: 'app-funding-list',
  imports: [RouterLink, TranslatePipe, PageHeader, FilterBar, Paginator, StatusPill],
  templateUrl: './funding-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FundingList {
  private readonly fundingApi = inject(FundingApi);

  protected readonly items = signal<Funding[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(false);
  protected readonly pageNo = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly status = signal<FundingStatus | ''>('');
  protected readonly search = signal('');

  protected readonly statusOptions = FUNDING_STATUSES;
  protected readonly skeletonRows: readonly number[] = [0, 1, 2, 3];
  protected readonly skeletonColumns: readonly number[] = [0, 1, 2, 3, 4, 5];

  private isFirstFilterRun = true;

  constructor() {
    // Any change to search/status should snap the page back to 1 (but not on
    // the very first run, which would otherwise be a redundant no-op write).
    effect(() => {
      this.search();
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
        searchKey: this.search() || undefined,
        status: this.status() || undefined,
      };
      this.loading.set(true);
      this.fundingApi.getFundingList(filters).subscribe({
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
    this.status.set(value as FundingStatus | '');
  }

  protected onClearFilters(): void {
    this.status.set('');
  }

  /** Raw ISO substring date formatting only — no shared date pipe exists yet. */
  protected formatDate(iso: string): string {
    return iso.slice(0, 10);
  }
}

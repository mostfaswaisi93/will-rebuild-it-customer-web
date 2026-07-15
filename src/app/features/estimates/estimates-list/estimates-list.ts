import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { EstimatesApi } from '@core/api/estimates-api.service';
import { ESTIMATE_STATUSES, Estimate, EstimateStatus } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { Paginator } from '@shared/ui/paginator/paginator';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/**
 * "Cost estimates" list — every bill-of-quantities estimate a reconstruction
 * team has produced for the current beneficiary's projects. Hand-rolled
 * responsive table/cards instead of the generic `DataTable` because a
 * `StatusPill` needs to be embedded in a cell, and `DataTable`'s cells are
 * plain-text only.
 */
@Component({
  selector: 'app-estimates-list',
  imports: [RouterLink, TranslatePipe, PageHeader, FilterBar, Paginator, StatusPill],
  templateUrl: './estimates-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstimatesList {
  private readonly estimatesApi = inject(EstimatesApi);

  protected readonly items = signal<Estimate[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(false);
  protected readonly pageNo = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly status = signal<EstimateStatus | ''>('');
  protected readonly search = signal('');

  protected readonly statusOptions = ESTIMATE_STATUSES;
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
      this.estimatesApi.getEstimates(filters).subscribe({
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
    this.status.set(value as EstimateStatus | '');
  }

  protected onClearFilters(): void {
    this.status.set('');
  }

  /** Raw ISO substring date formatting only — no shared date pipe exists yet. */
  protected formatDate(iso: string): string {
    return iso.slice(0, 10);
  }
}

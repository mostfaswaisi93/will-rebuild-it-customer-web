import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideInbox } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { RequestsApi } from '@core/api/requests-api.service';
import { REQUEST_STATUSES, ReconstructionRequest } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { Paginator } from '@shared/ui/paginator/paginator';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/**
 * `/app/requests` — the beneficiary's own reconstruction/assessment
 * requests, paginated + searchable + filterable by status.
 */
@Component({
  selector: 'app-requests-list',
  imports: [RouterLink, DatePipe, TranslatePipe, PageHeader, FilterBar, Paginator, StatusPill, LucideInbox],
  templateUrl: './requests-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestsList {
  private readonly requestsApi = inject(RequestsApi);

  protected readonly items = signal<ReconstructionRequest[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(false);

  protected readonly pageNo = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly search = signal('');
  protected readonly status = signal('');

  protected readonly statusOptions = REQUEST_STATUSES;
  protected readonly skeletonRows: readonly number[] = [0, 1, 2, 3];

  constructor() {
    effect(() => {
      const filters = {
        pageNo: this.pageNo(),
        pageSize: this.pageSize(),
        searchKey: this.search() || undefined,
        status: this.status() || undefined,
      };
      this.loading.set(true);
      this.requestsApi.getMyRequests(filters).subscribe({
        next: (result) => {
          this.items.set(result.items);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  protected onSearchChange(value: string): void {
    this.pageNo.set(1);
    this.search.set(value);
  }

  protected onStatusChange(value: string): void {
    this.pageNo.set(1);
    this.status.set(value);
  }

  protected onClearFilters(): void {
    this.pageNo.set(1);
    this.search.set('');
    this.status.set('');
  }
}

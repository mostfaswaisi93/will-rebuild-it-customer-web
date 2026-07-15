import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideMessageSquareWarning } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ComplaintsApi } from '@core/api/complaints-api.service';
import { COMPLAINT_STATUSES, Complaint, ComplaintReasons } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Paginator } from '@shared/ui/paginator/paginator';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/**
 * `/app/complaints` — the beneficiary's own filed complaints against
 * reconstruction teams, as a paginated card list filterable by status.
 * The complaints API only supports a status filter, so no free-text search
 * bar is shown.
 */
@Component({
  selector: 'app-complaints-list',
  imports: [RouterLink, DatePipe, TranslatePipe, PageHeader, Paginator, StatusPill, LucideMessageSquareWarning],
  templateUrl: './complaints-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplaintsList {
  private readonly complaintsApi = inject(ComplaintsApi);

  protected readonly items = signal<Complaint[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(false);

  protected readonly pageNo = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly status = signal('');

  protected readonly statusOptions = COMPLAINT_STATUSES;
  protected readonly skeletonRows: readonly number[] = [0, 1, 2, 3];

  private readonly reasonKeys: readonly (keyof Omit<ComplaintReasons, 'otherReasonDetail'>)[] = [
    'delay',
    'poorQuality',
    'specificationMismatch',
    'misconduct',
    'otherReason',
  ];

  constructor() {
    effect(() => {
      const filters = {
        pageNo: this.pageNo(),
        pageSize: this.pageSize(),
        status: this.status() || undefined,
      };
      this.loading.set(true);
      this.complaintsApi.getComplaints(filters).subscribe({
        next: (result) => {
          this.items.set(result.items);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  protected onStatusChange(value: string): void {
    this.pageNo.set(1);
    this.status.set(value);
  }

  /** The reason keys that are toggled on for a complaint, for chip rendering. */
  protected activeReasons(reasons: ComplaintReasons): readonly string[] {
    return this.reasonKeys.filter((key) => reasons[key]);
  }
}

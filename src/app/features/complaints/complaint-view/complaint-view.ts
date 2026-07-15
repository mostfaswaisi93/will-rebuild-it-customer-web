import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideMessageSquareReply } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ComplaintsApi } from '@core/api/complaints-api.service';
import { Complaint, ComplaintReasons } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';
import { SpinnerOverlay } from '@shared/ui/loader/spinner-overlay';

/**
 * `/app/complaints/:complaintId` — a single complaint's detail: the team it
 * concerns, when it was filed, its status, the selected reasons, the
 * description, and — once resolved — the response from the team or authority.
 */
@Component({
  selector: 'app-complaint-view',
  imports: [DatePipe, TranslatePipe, PageHeader, StatusPill, SpinnerOverlay, LucideMessageSquareReply],
  templateUrl: './complaint-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplaintView {
  private readonly complaintsApi = inject(ComplaintsApi);

  readonly complaintId = input.required<string>();

  protected readonly complaint = signal<Complaint | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadError = signal(false);
  protected readonly notFound = signal(false);

  protected readonly headerTitle = computed(() => this.complaint()?.complaintNumber ?? this.complaintId());

  private readonly reasonKeys: readonly (keyof Omit<ComplaintReasons, 'otherReasonDetail'>)[] = [
    'delay',
    'poorQuality',
    'specificationMismatch',
    'misconduct',
    'otherReason',
  ];

  protected readonly activeReasons = computed<readonly string[]>(() => {
    const reasons = this.complaint()?.reasons;
    if (!reasons) {
      return [];
    }
    return this.reasonKeys.filter((key) => reasons[key]);
  });

  constructor() {
    effect(() => {
      this.fetchComplaint(this.complaintId());
    });
  }

  protected retry(): void {
    this.fetchComplaint(this.complaintId());
  }

  private fetchComplaint(id: string): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.notFound.set(false);
    this.complaintsApi.getComplaintDetails(id).subscribe({
      next: (result) => {
        this.complaint.set(result);
        this.loading.set(false);
      },
      error: (error: { status?: number }) => {
        this.complaint.set(null);
        if (error.status === 404) {
          this.notFound.set(true);
        } else {
          this.loadError.set(true);
        }
        this.loading.set(false);
      },
    });
  }
}

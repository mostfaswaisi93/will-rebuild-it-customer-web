import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { LucideLifeBuoy, LucideSend } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { SupportApi } from '@core/api/support-api.service';
import { ToastService } from '@core/toast/toast.service';
import { SupportTicket } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';
import { SpinnerOverlay } from '@shared/ui/loader/spinner-overlay';

/**
 * `/app/support/:ticketId` — a single support request: its subject/status,
 * the opening description, a conversation timeline, and (while open) a reply
 * box that appends the newly-returned message to the local ticket.
 */
@Component({
  selector: 'app-support-view',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    TranslatePipe,
    PageHeader,
    StatusPill,
    SpinnerOverlay,
    LucideLifeBuoy,
    LucideSend,
  ],
  templateUrl: './support-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportView {
  private readonly supportApi = inject(SupportApi);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly ticketId = input.required<string>();

  protected readonly ticket = signal<SupportTicket | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadError = signal(false);
  protected readonly sending = signal(false);

  protected readonly headerTitle = computed(() => this.ticket()?.ticketNumber ?? this.ticketId());
  protected readonly isOpen = computed(() => this.ticket()?.status === 'open');

  protected readonly replyForm = this.fb.nonNullable.group({
    body: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  constructor() {
    effect(() => {
      this.fetchTicket(this.ticketId());
    });
  }

  protected retry(): void {
    this.fetchTicket(this.ticketId());
  }

  protected sendReply(): void {
    if (this.replyForm.invalid || this.sending()) {
      this.replyForm.markAllAsTouched();
      return;
    }

    const body = this.replyForm.controls.body.value.trim();
    if (!body) {
      return;
    }

    this.sending.set(true);
    this.supportApi.addMessage(this.ticketId(), body).subscribe({
      next: (updated) => {
        this.ticket.set(updated);
        this.replyForm.reset({ body: '' });
        this.sending.set(false);
        this.toast.success('support.view.replySuccess');
      },
      error: () => {
        this.sending.set(false);
        this.toast.danger('common.errorGeneric');
      },
    });
  }

  private fetchTicket(id: string): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.supportApi.getTicketDetails(id).subscribe({
      next: (result) => {
        this.ticket.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.ticket.set(null);
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideBell, LucideCheckCheck, LucideInbox, LucideTrash2 } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { NotificationsApi } from '@core/api/notifications-api.service';
import { ToastService } from '@core/toast/toast.service';
import { AppNotification } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';

/**
 * Beneficiary notifications inbox. Loads the full list once (the API is not
 * paged), then mutates the local signal optimistically on read/remove so the
 * UI stays responsive without re-fetching the whole list.
 */
@Component({
  selector: 'app-notifications-list',
  imports: [TranslatePipe, PageHeader, LucideBell, LucideCheckCheck, LucideInbox, LucideTrash2],
  templateUrl: './notifications-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsList {
  private readonly notificationsApi = inject(NotificationsApi);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly items = signal<AppNotification[]>([]);
  protected readonly loading = signal(false);
  protected readonly markingAll = signal(false);
  protected readonly skeletonRows: readonly number[] = [0, 1, 2, 3];

  protected readonly unreadCount = computed(() => this.items().filter((n) => !n.isRead).length);

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.notificationsApi.getNotifications().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onMarkAllRead(): void {
    if (this.unreadCount() === 0 || this.markingAll()) {
      return;
    }
    this.markingAll.set(true);
    this.notificationsApi.markAllRead().subscribe({
      next: (list) => {
        this.items.set(list);
        this.markingAll.set(false);
      },
      error: () => this.markingAll.set(false),
    });
  }

  protected onOpen(notification: AppNotification): void {
    if (!notification.isRead) {
      this.notificationsApi.markRead(notification.id).subscribe({
        next: (updated) => this.replaceLocal(updated),
        error: () => undefined,
      });
      this.items.update((list) =>
        list.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
      );
    }

    if (notification.linkUrl) {
      void this.router.navigateByUrl(notification.linkUrl);
    }
  }

  protected onRemove(event: Event, notification: AppNotification): void {
    event.stopPropagation();
    this.notificationsApi.remove(notification.id).subscribe({
      next: () => {
        this.items.update((list) => list.filter((n) => n.id !== notification.id));
        this.toast.success('notifications.list.removed');
      },
      error: () => undefined,
    });
  }

  private replaceLocal(updated: AppNotification): void {
    this.items.update((list) => list.map((n) => (n.id === updated.id ? updated : n)));
  }

  /** Raw ISO substring date formatting only — no shared date pipe exists yet. */
  protected formatDate(iso: string): string {
    return iso.slice(0, 10);
  }
}

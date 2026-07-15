import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LucideAlertTriangle, LucideDatabase } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Tabs, TabItem } from '@shared/ui/tabs/tabs';
import { DialogService } from '@shared/ui/dialog/dialog.service';
import { ConfirmDialog, ConfirmDialogData } from '@shared/ui/confirm-dialog/confirm-dialog';
import { NotificationPreferences } from '../notification-preferences/notification-preferences';

/**
 * `/app/account` — account settings split into two tabs via the headless
 * `Tabs` component: "Data & sharing" (informational data controls plus a
 * danger-zone deactivate action) and "Notifications" (the embedded
 * `NotificationPreferences` switches). Deactivation is mocked: a danger
 * confirm dialog followed by a toast, no destructive call.
 */
@Component({
  selector: 'app-account',
  imports: [
    TranslatePipe,
    PageHeader,
    Tabs,
    NotificationPreferences,
    LucideDatabase,
    LucideAlertTriangle,
  ],
  templateUrl: './account.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Account {
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  protected readonly tabItems: TabItem[] = [
    { id: 'data', labelKey: 'account.tabs.data' },
    { id: 'notifications', labelKey: 'account.tabs.notifications' },
  ];
  protected readonly activeTabId = signal('data');

  protected deactivate(): void {
    this.dialog
      .open<boolean, ConfirmDialogData>(ConfirmDialog, {
        data: {
          titleKey: 'account.deactivate.confirmTitle',
          bodyKey: 'account.deactivate.confirmBody',
          confirmKey: 'account.deactivate.confirmButton',
          cancelKey: 'common.cancel',
          tone: 'danger',
        },
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.toast.success('account.deactivate.done');
        }
      });
  }
}

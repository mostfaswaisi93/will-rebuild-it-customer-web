import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ProfileApi, NotificationPreferences as NotificationPrefs } from '@core/api/profile-api.service';
import { ToastService } from '@core/toast/toast.service';
import { Spinner } from '@shared/ui/loader/spinner';

interface ToggleConfig {
  key: 'projectUpdates' | 'fundingUpdates' | 'teamMessages' | 'donationReceipts';
  labelKey: string;
  descKey: string;
}

/**
 * Four notification switches backed by `ProfileApi.getNotificationPreferences`.
 * Changing any toggle immediately persists the whole preference set and
 * toasts on save — there is no explicit "Save" button. The initial load and
 * the enable/disable churn are pushed with `emitEvent: false` so only genuine
 * user toggles trigger a write.
 */
@Component({
  selector: 'app-notification-preferences',
  imports: [ReactiveFormsModule, TranslatePipe, Spinner],
  templateUrl: './notification-preferences.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationPreferences {
  private readonly fb = inject(FormBuilder);
  private readonly profileApi = inject(ProfileApi);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly saving = signal(false);

  protected readonly toggles: readonly ToggleConfig[] = [
    {
      key: 'projectUpdates',
      labelKey: 'account.notifications.projectUpdates',
      descKey: 'account.notifications.projectUpdatesDesc',
    },
    {
      key: 'fundingUpdates',
      labelKey: 'account.notifications.fundingUpdates',
      descKey: 'account.notifications.fundingUpdatesDesc',
    },
    {
      key: 'teamMessages',
      labelKey: 'account.notifications.teamMessages',
      descKey: 'account.notifications.teamMessagesDesc',
    },
    {
      key: 'donationReceipts',
      labelKey: 'account.notifications.donationReceipts',
      descKey: 'account.notifications.donationReceiptsDesc',
    },
  ];

  protected readonly form = this.fb.nonNullable.group({
    projectUpdates: false,
    fundingUpdates: false,
    teamMessages: false,
    donationReceipts: false,
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.persist());
    this.load();
  }

  protected retry(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.form.disable({ emitEvent: false });
    this.profileApi.getNotificationPreferences().subscribe({
      next: (prefs) => {
        this.form.patchValue(prefs, { emitEvent: false });
        this.form.enable({ emitEvent: false });
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  private persist(): void {
    const prefs: NotificationPrefs = this.form.getRawValue();
    this.saving.set(true);
    this.profileApi.updateNotificationPreferences(prefs).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('account.notifications.saved');
      },
      error: () => {
        this.saving.set(false);
        this.toast.danger('common.errorGeneric');
      },
    });
  }
}

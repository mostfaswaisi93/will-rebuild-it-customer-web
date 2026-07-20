import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { NotificationPreferences } from '../notification-preferences/notification-preferences';

/**
 * Standalone page for the notification switches, mirroring the original app's
 * dedicated `emailpreferences` route. The same control set is also reachable
 * as a tab inside Account — this route exists so links and bookmarks that
 * point straight at preferences resolve to a real page rather than dropping
 * the user on a generic settings screen.
 */
@Component({
  selector: 'app-email-preferences',
  imports: [TranslatePipe, PageHeader, NotificationPreferences],
  template: `
    <app-page-header
      [showBack]="true"
      [title]="'account.emailPreferences.title' | translate"
      [subtitle]="'account.emailPreferences.subtitle' | translate"
    />
    <app-notification-preferences />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailPreferences {}

import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideBadgeCheck, LucideHeart } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { DonationsApi } from '@core/api/donations-api.service';
import { Donation, DonationFrequency } from '@core/models';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { SpinnerOverlay } from '@shared/ui/loader/spinner-overlay';
import { QrCode } from '@shared/ui/qr-code/qr-code';
import { PublicNav } from '@features/public/public-nav/public-nav';

/**
 * Donation intent form, mounted at both `/app/donations/new` (authenticated)
 * and `/pub/donate/:projectId` (public). Real card capture (Stripe Elements +
 * PaymentIntent) is deferred to a later phase — this form only records the
 * donation intent and immediately returns a receipt/thank-you flow.
 */
@Component({
  selector: 'app-donate',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    PageHeader,
    SpinnerOverlay,
    QrCode,
    PublicNav,
    LucideBadgeCheck,
    LucideHeart,
  ],
  templateUrl: './donate.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Donate {
  /** From the public route param (`/pub/donate/:projectId`) or a `?projectId` query. */
  readonly projectId = input<string>();

  private readonly fb = inject(FormBuilder);
  private readonly donationsApi = inject(DonationsApi);
  private readonly sessionStore = inject(SessionStore);
  private readonly toastService = inject(ToastService);

  protected readonly isAuthenticated = this.sessionStore.isAuthenticated;

  protected readonly quickAmounts: readonly number[] = [25, 50, 100, 250];
  protected readonly frequencies: readonly DonationFrequency[] = ['once', 'monthly'];

  protected readonly isSubmitting = signal(false);
  protected readonly created = signal<Donation | null>(null);

  protected readonly form = this.fb.group({
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    frequency: this.fb.nonNullable.control<DonationFrequency>('once'),
    donorName: this.fb.nonNullable.control('', Validators.required),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    isAnonymous: this.fb.nonNullable.control(false),
  });

  protected readonly amountControl = this.form.controls.amount;
  protected readonly donorNameControl = this.form.controls.donorName;
  protected readonly emailControl = this.form.controls.email;

  protected readonly createdAmountLabel = computed(() => {
    const donation = this.created();
    return donation ? '$' + donation.amount.toLocaleString('en-US') : '';
  });

  protected selectAmount(value: number): void {
    this.amountControl.setValue(value);
    this.amountControl.markAsTouched();
  }

  protected selectFrequency(value: DonationFrequency): void {
    this.form.controls.frequency.setValue(value);
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (this.form.invalid || value.amount === null) {
      return;
    }

    this.isSubmitting.set(true);
    this.donationsApi
      .createDonation({
        amount: value.amount,
        currency: 'USD',
        frequency: value.frequency,
        projectId: this.projectId(),
        projectTitle: undefined,
        donorName: value.donorName,
        email: value.email,
        isAnonymous: value.isAnonymous,
      })
      .subscribe({
        next: (donation) => {
          this.isSubmitting.set(false);
          this.created.set(donation);
          this.toastService.success('donations.donate.success');
        },
        error: () => {
          this.isSubmitting.set(false);
          this.toastService.danger('common.errorGeneric');
        },
      });
  }
}

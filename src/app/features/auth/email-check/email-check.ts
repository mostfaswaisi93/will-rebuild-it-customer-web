import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideMail, LucideUserCheck } from '@lucide/angular';
import { AuthApi } from '@core/api/auth-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { AuthSession, UserRole } from '@core/models';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { SpinnerOverlay } from '@shared/ui/loader/spinner-overlay';
import { PasswordField } from '@shared/ui/password-field/password-field';
import { PublicNav } from '../../public/public-nav/public-nav';
import { roleHomeRoute } from '../role-redirect.util';

interface DemoAccount {
  readonly role: UserRole;
  readonly email: string;
  readonly password: string;
  readonly labelKey: string;
}

/** Seeded in the mock backend's `seedCredentials` (see auth.handler.ts / users.fixture.ts). */
const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { role: 'beneficiary', email: 'youssef@example.com', password: 'Demo@1234', labelKey: 'auth.emailCheck.demo.beneficiary' },
  { role: 'donor', email: 'amina@example.com', password: 'Demo@1234', labelKey: 'auth.emailCheck.demo.donor' },
  { role: 'team', email: 'team@example.com', password: 'Demo@1234', labelKey: 'auth.emailCheck.demo.team' },
];

type Step = 'email' | 'password' | 'unavailable';

/**
 * Mock sign-in flow, mounted at `/pub/email-check/:ctx`. Full signup/OTP
 * registration is deliberately out of scope this phase — this is a
 * check-email-then-password flow against the seeded demo accounts only.
 */
@Component({
  selector: 'app-email-check',
  imports: [ReactiveFormsModule, LucideMail, LucideUserCheck, TranslatePipe, SpinnerOverlay, PasswordField, PublicNav],
  templateUrl: './email-check.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailCheck {
  /** Accepted but not deeply used — only flips a couple of copy strings (e.g. `'donate'`). */
  readonly ctx = input.required<string>();

  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApi);
  private readonly sessionStore = inject(SessionStore);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly demoAccounts = DEMO_ACCOUNTS;

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: [''],
  });

  protected readonly emailControl = this.form.controls.email;
  protected readonly passwordControl = this.form.controls.password;

  protected readonly step = signal<Step>('email');
  protected readonly isSubmitting = signal(false);
  protected readonly passwordErrorKey = signal<string | null>(null);

  protected readonly isDonateContext = computed(() => this.ctx() === 'donate');

  protected onFormSubmit(): void {
    if (this.step() === 'email') {
      this.submitEmail();
    } else if (this.step() === 'password') {
      this.submitPassword();
    }
  }

  protected changeEmail(): void {
    this.step.set('email');
    this.passwordErrorKey.set(null);
    this.passwordControl.reset('');
    this.passwordControl.clearValidators();
    this.passwordControl.updateValueAndValidity();
  }

  protected fillDemoAccount(account: DemoAccount): void {
    this.passwordErrorKey.set(null);
    this.form.setValue({ email: account.email, password: account.password });
    this.passwordControl.setValidators([Validators.required]);
    this.passwordControl.updateValueAndValidity();
    this.step.set('password');
  }

  private submitEmail(): void {
    this.emailControl.markAsTouched();
    if (this.emailControl.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    this.authApi.checkEmail(this.emailControl.value).subscribe({
      next: (exists) => {
        this.isSubmitting.set(false);
        if (exists) {
          this.passwordControl.setValidators([Validators.required]);
          this.passwordControl.updateValueAndValidity();
          this.step.set('password');
        } else {
          this.step.set('unavailable');
        }
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.danger('common.errorGeneric');
      },
    });
  }

  private submitPassword(): void {
    this.passwordControl.markAsTouched();
    if (this.passwordControl.invalid) {
      return;
    }

    this.passwordErrorKey.set(null);
    this.isSubmitting.set(true);
    this.authApi.login(this.emailControl.value, this.passwordControl.value).subscribe({
      next: (session) => this.onLoginSuccess(session),
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        if (error.status === 401) {
          this.passwordErrorKey.set('auth.emailCheck.incorrectPassword');
        } else {
          this.toastService.danger('common.errorGeneric');
        }
      },
    });
  }

  private onLoginSuccess(session: AuthSession): void {
    this.isSubmitting.set(false);
    this.sessionStore.setSession(session);
    this.toastService.success('auth.emailCheck.welcomeBack', { name: session.user.firstName });
    void this.router.navigateByUrl(roleHomeRoute(session.user.role));
  }
}

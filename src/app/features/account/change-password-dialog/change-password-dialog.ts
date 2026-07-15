import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ProfileApi } from '@core/api/profile-api.service';
import { ToastService } from '@core/toast/toast.service';
import { DialogShell } from '@shared/ui/dialog/dialog-shell';
import { PasswordField } from '@shared/ui/password-field/password-field';

/** Mirrors the live checklist in `PasswordField`: 8-15 chars with upper, lower, number and symbol. */
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,15}$/;

/**
 * Group-level validator: flags a `mismatch` error when `newPassword` and
 * `confirmPassword` are both filled but differ. Defined inline here rather
 * than imported so the dialog is self-contained.
 */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const next = group.get('newPassword')?.value as string | undefined;
  const confirm = group.get('confirmPassword')?.value as string | undefined;
  if (!next || !confirm) {
    return null;
  }
  return next === confirm ? null : { mismatch: true };
}

/**
 * Reactive-form dialog for changing the account password: current password,
 * a new password (with the live rules checklist) and a confirmation checked
 * by the inline `passwordsMatch` validator. On success it toasts and closes
 * with `true`; the caller only needs to open it.
 */
@Component({
  selector: 'app-change-password-dialog',
  imports: [DialogShell, ReactiveFormsModule, PasswordField, TranslatePipe],
  templateUrl: './change-password-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordDialog {
  private readonly fb = inject(FormBuilder);
  private readonly profileApi = inject(ProfileApi);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(DialogRef<boolean>);

  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.pattern(STRONG_PASSWORD)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.form.getRawValue();
    this.submitting.set(true);
    this.profileApi.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast.success('profile.changePassword.saved');
        this.dialogRef.close(true);
      },
      error: () => {
        this.submitting.set(false);
        this.toast.danger('common.errorGeneric');
      },
    });
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}

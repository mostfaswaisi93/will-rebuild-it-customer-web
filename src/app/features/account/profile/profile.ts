import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ProfileApi } from '@core/api/profile-api.service';
import { ToastService } from '@core/toast/toast.service';
import { Address, BeneficiaryProfile } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { AddressPicker } from '@shared/ui/address-picker/address-picker';
import { QrCode } from '@shared/ui/qr-code/qr-code';
import { Skeleton } from '@shared/ui/loader/skeleton';
import { DialogService } from '@shared/ui/dialog/dialog.service';
import { ChangePasswordDialog } from '../change-password-dialog/change-password-dialog';

/**
 * `/app/profile` — the beneficiary's own profile. A two-column layout on
 * large screens: an editable personal-information form on the left (locked
 * behind an explicit "Edit" toggle) and an identity panel on the right
 * (avatar, name, id + QR code, and a change-password entry point). Phone and
 * email are shown read-only; only name, property address, and family size are
 * editable.
 */
@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, TranslatePipe, PageHeader, AddressPicker, QrCode, Skeleton],
  templateUrl: './profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  private readonly fb = inject(FormBuilder);
  private readonly profileApi = inject(ProfileApi);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);

  protected readonly profile = signal<BeneficiaryProfile | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly editing = signal(false);
  protected readonly saving = signal(false);

  protected readonly form = this.fb.group({
    firstName: this.fb.nonNullable.control('', Validators.required),
    lastName: this.fb.nonNullable.control('', Validators.required),
    familySize: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    propertyAddress: this.fb.control<Address | null>(null, Validators.required),
  });

  protected readonly fullName = computed(() => {
    const p = this.profile();
    return p ? `${p.firstName} ${p.lastName}`.trim() : '';
  });

  protected readonly initials = computed(() => {
    const p = this.profile();
    if (!p) {
      return '';
    }
    return `${p.firstName.charAt(0)}${p.lastName.charAt(0)}`.toUpperCase();
  });

  constructor() {
    this.load();
  }

  protected retry(): void {
    this.load();
  }

  protected startEdit(): void {
    this.editing.set(true);
    this.form.enable();
  }

  protected cancelEdit(): void {
    const p = this.profile();
    if (p) {
      this.patchForm(p);
    }
    this.form.disable();
    this.editing.set(false);
  }

  protected save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const patch: Partial<BeneficiaryProfile> = {
      firstName: raw.firstName,
      lastName: raw.lastName,
      familySize: raw.familySize,
      propertyAddress: raw.propertyAddress ?? undefined,
    };

    this.saving.set(true);
    this.profileApi.updateProfile(patch).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.patchForm(updated);
        this.form.disable();
        this.editing.set(false);
        this.saving.set(false);
        this.toast.success('profile.saved');
      },
      error: () => {
        this.saving.set(false);
        this.toast.danger('common.errorGeneric');
      },
    });
  }

  protected openChangePassword(): void {
    this.dialog.open<boolean>(ChangePasswordDialog).subscribe();
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.profileApi.getProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.patchForm(p);
        this.form.disable();
        this.editing.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  private patchForm(p: BeneficiaryProfile): void {
    this.form.patchValue({
      firstName: p.firstName,
      lastName: p.lastName,
      familySize: p.familySize,
      propertyAddress: p.propertyAddress,
    });
  }
}

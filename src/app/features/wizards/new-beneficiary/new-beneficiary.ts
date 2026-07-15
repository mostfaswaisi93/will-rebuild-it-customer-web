import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { LucideCircleCheck } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { RequestsApi } from '@core/api/requests-api.service';
import { Address, DamageSeverity, PropertyType, ReconstructionRequest } from '@core/models';
import { ToastService } from '@core/toast/toast.service';
import { AddressPicker } from '@shared/ui/address-picker/address-picker';
import { DamageCategorySelect } from '@shared/ui/damage-category-select/damage-category-select';
import { SeveritySelect } from '@shared/ui/severity-select/severity-select';
import { FileUploader, UploadableFile } from '@shared/ui/file-uploader/file-uploader';
import { PhoneInput } from '@shared/ui/phone-input/phone-input';
import { PasswordField } from '@shared/ui/password-field/password-field';
import { OtpVerificationStep } from '@shared/ui/otp-verification-step/otp-verification-step';
import { SpinnerOverlay } from '@shared/ui/loader/spinner-overlay';
import { PublicNav } from '@features/public/public-nav/public-nav';
import { WizardStepper } from '../wizard-stepper/wizard-stepper';
import { addressComplete, gazaPhone } from '../wizard-validators';

/**
 * Inline cross-field validator (kept local per spec, not imported): flags a
 * mismatch between two controls in the same group by setting a `mustMatch`
 * error on the group.
 */
function mustMatch(controlName: string, matchingControlName: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const control = group.get(controlName);
    const matching = group.get(matchingControlName);
    if (!control || !matching || !matching.value) {
      return null;
    }
    return control.value === matching.value ? null : { mustMatch: true };
  };
}

/**
 * `/pub/new-beneficiary/:teamId` — a public 4-step onboarding wizard: report
 * the damage, verify the email (mock OTP), set a password, then review and
 * submit a damage report. The `teamId` is optional so the page also mounts at
 * `/pub/new-beneficiary` with no pre-selected team.
 */
@Component({
  selector: 'app-new-beneficiary',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    PublicNav,
    WizardStepper,
    AddressPicker,
    DamageCategorySelect,
    SeveritySelect,
    FileUploader,
    PhoneInput,
    PasswordField,
    OtpVerificationStep,
    SpinnerOverlay,
    LucideCircleCheck,
  ],
  templateUrl: './new-beneficiary.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewBeneficiary {
  readonly teamId = input<string>();

  private readonly fb = inject(FormBuilder);
  private readonly requestsApi = inject(RequestsApi);
  private readonly toast = inject(ToastService);

  protected readonly currentStep = signal(0);
  protected readonly isSubmitting = signal(false);
  protected readonly otpCode = signal('');
  protected readonly otpError = signal(false);
  protected readonly result = signal<ReconstructionRequest | null>(null);
  protected readonly photos = signal<UploadableFile[]>([]);

  private readonly stepTitleKeys = [
    'wizards.newBeneficiary.steps.contact',
    'wizards.newBeneficiary.steps.verify',
    'wizards.newBeneficiary.steps.password',
    'wizards.newBeneficiary.steps.confirm',
  ];
  protected readonly totalSteps = this.stepTitleKeys.length;
  protected readonly stepTitleKey = computed(() => this.stepTitleKeys[this.currentStep()] ?? '');

  protected readonly form = this.fb.group(
    {
      email: this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      phone: this.fb.control('', { nonNullable: true, validators: [Validators.required, gazaPhone] }),
      firstName: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
      lastName: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
      propertyType: this.fb.control<PropertyType | null>(null, Validators.required),
      severity: this.fb.control<DamageSeverity | null>(null, Validators.required),
      address: this.fb.control<Address | null>(null, addressComplete),
      description: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(1000)],
      }),
      consent: this.fb.control(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
      password: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmPassword: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: mustMatch('password', 'confirmPassword') },
  );

  private readonly contactControlNames = [
    'email',
    'phone',
    'firstName',
    'lastName',
    'propertyType',
    'severity',
    'address',
    'description',
    'consent',
  ] as const;

  protected onResend(): void {
    this.toast.success('wizards.newBeneficiary.verify.resent');
  }

  protected goBack(): void {
    this.currentStep.update((step) => Math.max(0, step - 1));
  }

  protected goNext(): void {
    const step = this.currentStep();
    if (step === 0) {
      if (!this.validateContactStep()) {
        return;
      }
    } else if (step === 1) {
      if (!/^\d{6}$/.test(this.otpCode())) {
        this.otpError.set(true);
        return;
      }
      this.otpError.set(false);
    } else if (step === 2) {
      if (!this.validatePasswordStep()) {
        return;
      }
    }
    this.currentStep.update((current) => Math.min(this.totalSteps - 1, current + 1));
  }

  private validateContactStep(): boolean {
    let valid = true;
    for (const name of this.contactControlNames) {
      const control = this.form.get(name);
      if (control) {
        control.markAsTouched();
        if (control.invalid) {
          valid = false;
        }
      }
    }
    return valid;
  }

  private validatePasswordStep(): boolean {
    this.form.controls.password.markAsTouched();
    this.form.controls.confirmPassword.markAsTouched();
    return (
      this.form.controls.password.valid &&
      this.form.controls.confirmPassword.valid &&
      !this.form.hasError('mustMatch')
    );
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const { address, propertyType, severity } = raw;
    if (!address || !propertyType || !severity) {
      return;
    }

    this.isSubmitting.set(true);
    this.requestsApi
      .submitDamageReport({
        type: 'reconstruction',
        propertyType,
        severity,
        description: raw.description,
        address,
        teamId: this.teamId() || undefined,
        contactName: `${raw.firstName} ${raw.lastName}`.trim(),
        contactPhone: raw.phone,
      })
      .subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.result.set(created);
          this.toast.success('wizards.newBeneficiary.submitSuccess');
        },
        error: () => {
          this.isSubmitting.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }
}

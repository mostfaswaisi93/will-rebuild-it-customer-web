import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { RequestsApi } from '@core/api/requests-api.service';
import { TeamsApi } from '@core/api/teams-api.service';
import { Address, DamageSeverity, PropertyType, Team } from '@core/models';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { AddressPicker } from '@shared/ui/address-picker/address-picker';
import { DamageCategorySelect } from '@shared/ui/damage-category-select/damage-category-select';
import { SeveritySelect } from '@shared/ui/severity-select/severity-select';
import { FileUploader, UploadableFile } from '@shared/ui/file-uploader/file-uploader';
import { SpinnerOverlay } from '@shared/ui/loader/spinner-overlay';
import { WizardStepper } from '../wizard-stepper/wizard-stepper';
import { addressComplete } from '../wizard-validators';

/**
 * `/app/request/to-team/:teamId` — a two-step wizard for a beneficiary to send
 * a reconstruction request directly to a chosen team. Step 1 captures the
 * damage details; step 2 is a read-only review before submitting.
 */
@Component({
  selector: 'app-request-wizard',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    PageHeader,
    WizardStepper,
    AddressPicker,
    DamageCategorySelect,
    SeveritySelect,
    FileUploader,
    SpinnerOverlay,
  ],
  templateUrl: './request-wizard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestWizard {
  readonly teamId = input.required<string>();

  private readonly fb = inject(FormBuilder);
  private readonly requestsApi = inject(RequestsApi);
  private readonly teamsApi = inject(TeamsApi);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly team = signal<Team | null>(null);
  protected readonly currentStep = signal(0);
  protected readonly isSubmitting = signal(false);

  protected readonly photos = signal<UploadableFile[]>([]);

  private readonly stepTitleKeys = ['wizards.request.steps.details', 'wizards.request.steps.confirm'];
  protected readonly stepTitleKey = computed(() => this.stepTitleKeys[this.currentStep()] ?? '');
  protected readonly totalSteps = this.stepTitleKeys.length;

  protected readonly form = this.fb.group({
    address: this.fb.control<Address | null>(null, addressComplete),
    propertyType: this.fb.control<PropertyType | null>(null, Validators.required),
    severity: this.fb.control<DamageSeverity | null>(null, Validators.required),
    description: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(1000)],
    }),
    consent: this.fb.control(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  constructor() {
    effect(() => {
      const id = this.teamId();
      this.teamsApi.getTeamProfile(id).subscribe({
        next: (team) => this.team.set(team),
        error: () => this.team.set(null),
      });
    });
  }

  protected goNext(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.currentStep.set(1);
  }

  protected goBack(): void {
    this.currentStep.set(0);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.currentStep.set(0);
      return;
    }

    const raw = this.form.getRawValue();
    const { address, propertyType, severity } = raw;
    if (!address || !propertyType || !severity) {
      return;
    }

    this.isSubmitting.set(true);
    this.requestsApi
      .createRequest({
        type: 'reconstruction',
        propertyType,
        severity,
        description: raw.description,
        address,
        teamId: this.teamId(),
      })
      .subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.toast.success('wizards.request.submitSuccess');
          void this.router.navigate(['/app/requests', created.id]);
        },
        error: () => {
          this.isSubmitting.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }
}

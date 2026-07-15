import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideCircleCheck } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { RequestsApi } from '@core/api/requests-api.service';
import { MasterApi } from '@core/api/master-api.service';
import { Address, AssessmentQuestion, DamageSeverity, PropertyType, ReconstructionRequest } from '@core/models';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { AddressPicker } from '@shared/ui/address-picker/address-picker';
import { FileUploader, UploadableFile } from '@shared/ui/file-uploader/file-uploader';
import { SpinnerOverlay } from '@shared/ui/loader/spinner-overlay';
import { WizardStepper } from '../wizard-stepper/wizard-stepper';
import { addressComplete } from '../wizard-validators';

type AnswerValue = string | string[] | number;

const PROPERTY_MAP: Record<string, PropertyType> = {
  'opt-residential': 'residential',
  'opt-commercial': 'commercial',
  'opt-agricultural': 'agricultural',
  'opt-infrastructure': 'infrastructure',
  'opt-public': 'publicFacility',
};

const SEVERITY_MAP: Record<string, DamageSeverity> = {
  'opt-partial': 'partial',
  'opt-severe': 'severe',
  'opt-total': 'totalLoss',
};

/**
 * `/app/request/new` — a self-assessment wizard that walks the beneficiary
 * through the backend-provided assessment questions (one per step), then
 * collects free-text details, photos and location before submitting an
 * `assessment`-type request. Property type and severity are derived from the
 * relevant answers.
 */
@Component({
  selector: 'app-assessment-wizard',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    PageHeader,
    WizardStepper,
    AddressPicker,
    FileUploader,
    SpinnerOverlay,
    LucideCircleCheck,
  ],
  templateUrl: './assessment-wizard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssessmentWizard {
  private readonly fb = inject(FormBuilder);
  private readonly requestsApi = inject(RequestsApi);
  private readonly masterApi = inject(MasterApi);
  private readonly toast = inject(ToastService);

  protected readonly questions = signal<AssessmentQuestion[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);

  protected readonly stepIndex = signal(0);
  protected readonly isSubmitting = signal(false);
  protected readonly questionError = signal(false);
  protected readonly result = signal<ReconstructionRequest | null>(null);

  protected readonly answers = signal<Record<string, AnswerValue>>({});
  protected readonly photos = signal<UploadableFile[]>([]);

  protected readonly totalSteps = computed(() => this.questions().length + 1);
  protected readonly stepNumber = computed(() => this.stepIndex() + 1);
  protected readonly isDetailsStep = computed(() => this.stepIndex() === this.questions().length);
  protected readonly currentQuestion = computed<AssessmentQuestion | null>(
    () => this.questions()[this.stepIndex()] ?? null,
  );

  protected readonly detailsForm = this.fb.group({
    address: this.fb.control<Address | null>(null, addressComplete),
    description: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(1000)],
    }),
    consent: this.fb.control(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  constructor() {
    this.masterApi.getAssessmentQuestions().subscribe({
      next: (questions) => {
        this.questions.set(questions);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  protected retryLoad(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.masterApi.getAssessmentQuestions().subscribe({
      next: (questions) => {
        this.questions.set(questions);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  protected radioValue(questionId: string): string | null {
    const value = this.answers()[questionId];
    return typeof value === 'string' ? value : null;
  }

  protected selectRadio(questionId: string, optionId: string): void {
    this.answers.update((current) => ({ ...current, [questionId]: optionId }));
  }

  protected checkboxValues(questionId: string): string[] {
    const value = this.answers()[questionId];
    return Array.isArray(value) ? value : [];
  }

  protected toggleCheckbox(questionId: string, optionId: string): void {
    this.answers.update((current) => {
      const existing = current[questionId];
      const list = Array.isArray(existing) ? existing : [];
      const next = list.includes(optionId) ? list.filter((id) => id !== optionId) : [...list, optionId];
      return { ...current, [questionId]: next };
    });
  }

  protected textValue(questionId: string): string {
    const value = this.answers()[questionId];
    return typeof value === 'string' ? value : '';
  }

  protected setText(questionId: string, value: string): void {
    this.answers.update((current) => ({ ...current, [questionId]: value }));
  }

  protected numberValue(questionId: string): string {
    const value = this.answers()[questionId];
    return typeof value === 'number' ? String(value) : '';
  }

  protected setNumber(questionId: string, raw: string): void {
    const parsed = Number(raw);
    const value: AnswerValue = raw === '' || Number.isNaN(parsed) ? '' : parsed;
    this.answers.update((current) => ({ ...current, [questionId]: value }));
  }

  private isAnswered(question: AssessmentQuestion): boolean {
    const value = this.answers()[question.id];
    if (value === undefined) {
      return false;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'number') {
      return true;
    }
    return value.trim().length > 0;
  }

  protected goNext(): void {
    if (this.isDetailsStep()) {
      this.submit();
      return;
    }
    const question = this.currentQuestion();
    if (question && !this.isAnswered(question)) {
      this.questionError.set(true);
      return;
    }
    this.questionError.set(false);
    this.stepIndex.update((index) => index + 1);
  }

  protected goBack(): void {
    this.questionError.set(false);
    this.stepIndex.update((index) => Math.max(0, index - 1));
  }

  protected derivedPropertyType(): PropertyType {
    const value = this.answers()['q-property-type'];
    const id = typeof value === 'string' ? value : '';
    return PROPERTY_MAP[id] ?? 'residential';
  }

  protected derivedSeverity(): DamageSeverity {
    const value = this.answers()['q-severity'];
    const id = typeof value === 'string' ? value : '';
    return SEVERITY_MAP[id] ?? 'partial';
  }

  private submit(): void {
    if (this.detailsForm.invalid) {
      this.detailsForm.markAllAsTouched();
      return;
    }
    const raw = this.detailsForm.getRawValue();
    const address = raw.address;
    if (!address) {
      return;
    }

    this.isSubmitting.set(true);
    this.requestsApi
      .createRequest({
        type: 'assessment',
        propertyType: this.derivedPropertyType(),
        severity: this.derivedSeverity(),
        description: raw.description,
        address,
      })
      .subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.result.set(created);
          this.toast.success('wizards.assessment.submitSuccess');
        },
        error: () => {
          this.isSubmitting.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }
}

import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideAlertTriangle,
  LucideBadgeCheck,
  LucideBuilding2,
  LucideCalculator,
  LucideReceipt,
} from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { EstimatesApi } from '@core/api/estimates-api.service';
import { ToastService } from '@core/toast/toast.service';
import { BoqCategory, Estimate } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';
import { QrCode } from '@shared/ui/qr-code/qr-code';
import { SignaturePad } from '@shared/ui/signature-pad/signature-pad';
import { SpinnerOverlay } from '@shared/ui/loader/spinner-overlay';
import { DialogService } from '@shared/ui/dialog/dialog.service';
import { ConfirmDialog, ConfirmDialogData } from '@shared/ui/confirm-dialog/confirm-dialog';

/**
 * Cost-estimate detail page. `estimateId` is route-bound
 * (`withComponentInputBinding()`), arriving automatically from
 * `/app/estimates/:estimateId`. Beneficiaries review the bill of quantities
 * grouped by category, then — while the estimate is pending — approve it by
 * accepting terms and capturing a signature, or reject it. Funding itself
 * comes from donors, so there is deliberately no payment step here.
 */
@Component({
  selector: 'app-estimate-view',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    LucideAlertTriangle,
    LucideBadgeCheck,
    LucideBuilding2,
    LucideCalculator,
    LucideReceipt,
    PageHeader,
    StatusPill,
    QrCode,
    SignaturePad,
    SpinnerOverlay,
  ],
  templateUrl: './estimate-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstimateView {
  private readonly estimatesApi = inject(EstimatesApi);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);
  private readonly fb = inject(FormBuilder);

  readonly estimateId = input.required<string>();

  protected readonly estimate = signal<Estimate | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly submitting = signal(false);

  /** Base64 PNG data URL captured from the signature pad, if any. */
  protected readonly signatureImage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    terms: [false, Validators.requiredTrue],
  });

  private readonly termsAccepted = toSignal(this.form.controls.terms.valueChanges, {
    initialValue: this.form.controls.terms.value,
  });

  /** Approve is only offered once the terms are accepted AND a signature exists. */
  protected readonly canApprove = computed(
    () => this.termsAccepted() && this.signatureImage() !== null && !this.submitting(),
  );

  /** BOQ items grouped into the four fixed categories, dropping empty groups. */
  protected readonly boqGroups = computed(() => {
    const est = this.estimate();
    if (!est) {
      return [];
    }
    const categories: readonly BoqCategory[] = ['materials', 'labor', 'equipment', 'custom'];
    return categories
      .map((category) => ({
        category,
        items: est.items.filter((item) => item.category === category),
      }))
      .filter((group) => group.items.length > 0);
  });

  constructor() {
    // Reload whenever the route param changes.
    effect(() => {
      this.fetchEstimate(this.estimateId());
    });
  }

  protected reload(): void {
    this.fetchEstimate(this.estimateId());
  }

  private fetchEstimate(id: string): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.estimate.set(null);
    this.form.reset();
    this.signatureImage.set(null);
    this.estimatesApi.getEstimateDetails(id).subscribe({
      next: (estimate) => {
        this.estimate.set(estimate);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  protected onSigned(dataUrl: string): void {
    this.signatureImage.set(dataUrl);
  }

  protected approve(): void {
    const est = this.estimate();
    const signature = this.signatureImage();
    if (!est || !signature || !this.form.controls.terms.value || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.estimatesApi.approveEstimate(est.id, signature).subscribe({
      next: (updated) => {
        this.estimate.set(updated);
        this.submitting.set(false);
        this.toast.success('estimates.view.approveSuccess');
      },
      error: () => {
        this.submitting.set(false);
        this.toast.danger('common.errorGeneric');
      },
    });
  }

  protected reject(): void {
    const est = this.estimate();
    if (!est || this.submitting()) {
      return;
    }
    this.dialog
      .open<boolean, ConfirmDialogData>(ConfirmDialog, {
        data: {
          titleKey: 'estimates.reject.title',
          bodyKey: 'estimates.reject.body',
          tone: 'danger',
          confirmKey: 'estimates.reject.confirm',
        },
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.submitting.set(true);
        this.estimatesApi.rejectEstimate(est.id, '').subscribe({
          next: (updated) => {
            this.estimate.set(updated);
            this.submitting.set(false);
            this.toast.success('estimates.view.rejectSuccess');
          },
          error: () => {
            this.submitting.set(false);
            this.toast.danger('common.errorGeneric');
          },
        });
      });
  }

  /** Raw ISO substring date formatting only — no shared date pipe exists yet. */
  protected formatDate(iso: string): string {
    return iso.slice(0, 10);
  }
}

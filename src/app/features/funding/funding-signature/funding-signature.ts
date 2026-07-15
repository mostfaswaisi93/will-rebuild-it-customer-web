import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { FundingApi } from '@core/api/funding-api.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { SignaturePad } from '@shared/ui/signature-pad/signature-pad';

/**
 * `/app/funding/:fundingId/sign` — captures the beneficiary's signature to
 * confirm receipt / handover for a funding record. On capture it posts the
 * signature to the backend, then returns to the funding detail page.
 */
@Component({
  selector: 'app-funding-signature',
  imports: [TranslatePipe, PageHeader, SignaturePad],
  templateUrl: './funding-signature.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FundingSignature {
  private readonly fundingApi = inject(FundingApi);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly fundingId = input.required<string>();

  protected readonly submitting = signal(false);

  protected onCaptured(signatureImage: string): void {
    if (this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.fundingApi.confirmReceipt(this.fundingId(), { signatureImage, signatureType: 'draw' }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastService.success('funding.signature.success');
        void this.router.navigate(['/app/funding', this.fundingId()]);
      },
      error: () => {
        this.submitting.set(false);
        this.toastService.danger('common.errorGeneric');
      },
    });
  }

  protected onCancel(): void {
    void this.router.navigate(['/app/funding', this.fundingId()]);
  }
}

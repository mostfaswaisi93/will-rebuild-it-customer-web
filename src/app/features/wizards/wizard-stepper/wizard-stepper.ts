import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@core/i18n/translate.pipe';

/**
 * Small presentational stepper header for the wizards: a segmented progress
 * bar, the current step title, and a "Step N of M" counter. `title` is an
 * already-translated string (the caller runs it through the translate pipe,
 * matching the `PageHeader` convention) so this works for both static
 * translation keys and dynamic backend-provided titles (assessment prompts).
 */
@Component({
  selector: 'app-wizard-stepper',
  imports: [TranslatePipe],
  templateUrl: './wizard-stepper.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardStepper {
  /** 1-based index of the current step. */
  readonly stepNumber = input.required<number>();
  readonly totalSteps = input.required<number>();
  /** Already-translated title of the current step. */
  readonly title = input.required<string>();

  protected readonly segments = computed(() => Array.from({ length: this.totalSteps() }, (_, i) => i));
}

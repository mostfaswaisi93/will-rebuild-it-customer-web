import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TeamsApi } from '@core/api/teams-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { TeamReview } from '@core/models';
import { DialogShell } from '@shared/ui/dialog/dialog-shell';
import { RatingStars } from '@shared/ui/rating-stars/rating-stars';

export interface TeamReviewDialogData {
  projectId: string;
  teamId: string;
  /** When the current user already reviewed this team, pre-fills the form so they can revise it. */
  existingReview?: TeamReview | null;
}

/**
 * Reactive-form dialog for rating a team on a completed/in-progress project:
 * three 1-5 star criteria (workQuality/timeliness/professionalism) plus a
 * free-text comment. `RatingStars` isn't a `ControlValueAccessor`, so each
 * star row is wired into the form manually (`[value]` + `(valueChange)` ->
 * `setValue`) while `comments` uses a normal `formControlName`.
 *
 * Submitting always POSTs a new review via `TeamsApi.submitTeamReview` (the
 * API has no update endpoint) and closes the dialog with the created
 * `TeamReview`; the caller (`ProjectView`) is responsible for merging it into
 * its local reviews list.
 */
@Component({
  selector: 'app-team-review-dialog',
  imports: [DialogShell, ReactiveFormsModule, RatingStars, TranslatePipe],
  templateUrl: './team-review-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamReviewDialog {
  protected readonly data = inject<TeamReviewDialogData>(DIALOG_DATA);

  private readonly dialogRef = inject(DialogRef<TeamReview>);
  private readonly teamsApi = inject(TeamsApi);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    workQuality: [
      this.data.existingReview?.workQuality ?? 0,
      [Validators.required, Validators.min(1), Validators.max(5)],
    ],
    timeliness: [
      this.data.existingReview?.timeliness ?? 0,
      [Validators.required, Validators.min(1), Validators.max(5)],
    ],
    professionalism: [
      this.data.existingReview?.professionalism ?? 0,
      [Validators.required, Validators.min(1), Validators.max(5)],
    ],
    comments: [this.data.existingReview?.comments ?? '', [Validators.required, Validators.maxLength(1000)]],
  });

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const user = this.session.user();
    const authorName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
    const { workQuality, timeliness, professionalism, comments } = this.form.getRawValue();

    this.submitting.set(true);
    this.teamsApi
      .submitTeamReview(this.data.teamId, {
        projectId: this.data.projectId,
        authorName,
        workQuality,
        timeliness,
        professionalism,
        comments,
      })
      .subscribe({
        next: (review) => {
          this.submitting.set(false);
          this.dialogRef.close(review);
        },
        error: () => {
          this.submitting.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}

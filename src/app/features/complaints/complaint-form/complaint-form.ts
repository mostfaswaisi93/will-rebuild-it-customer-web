import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ComplaintsApi } from '@core/api/complaints-api.service';
import { TeamsApi } from '@core/api/teams-api.service';
import { ProjectsApi } from '@core/api/projects-api.service';
import { ToastService } from '@core/toast/toast.service';
import { ComplaintReasons, Project, Team } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { SpinnerOverlay } from '@shared/ui/loader/spinner-overlay';
import { FileUploader, UploadableFile } from '@shared/ui/file-uploader/file-uploader';
import { DialogService } from '@shared/ui/dialog/dialog.service';
import { ConfirmDialog, ConfirmDialogData } from '@shared/ui/confirm-dialog/confirm-dialog';

/** At least one complaint reason must be selected. */
function atLeastOneReason(group: AbstractControl): ValidationErrors | null {
  const values = Object.values(group.value as Record<string, boolean>);
  return values.some((checked) => checked) ? null : { noReason: true };
}

/**
 * `/app/complaints/new/:teamId` — files a complaint against a specific team.
 * The team name is fetched up-front for the header and the created payload;
 * the beneficiary picks reasons, writes a description, optionally links a
 * project, and attaches photos. On success a thank-you dialog is shown before
 * returning to the complaints list.
 */
@Component({
  selector: 'app-complaint-form',
  imports: [ReactiveFormsModule, TranslatePipe, PageHeader, SpinnerOverlay, FileUploader],
  templateUrl: './complaint-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplaintForm {
  private readonly complaintsApi = inject(ComplaintsApi);
  private readonly teamsApi = inject(TeamsApi);
  private readonly projectsApi = inject(ProjectsApi);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly teamId = input.required<string>();

  protected readonly team = signal<Team | null>(null);
  protected readonly teamLoading = signal(false);
  protected readonly teamError = signal(false);

  protected readonly projects = signal<Project[]>([]);
  protected readonly submitting = signal(false);
  protected readonly showOtherDetail = signal(false);

  protected readonly reasonKeys = [
    'delay',
    'poorQuality',
    'specificationMismatch',
    'misconduct',
    'otherReason',
  ] as const;

  protected readonly form = this.fb.nonNullable.group({
    projectId: [''],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    reasons: this.fb.nonNullable.group(
      {
        delay: [false],
        poorQuality: [false],
        specificationMismatch: [false],
        misconduct: [false],
        otherReason: [false],
      },
      { validators: atLeastOneReason },
    ),
    otherReasonDetail: [''],
  });

  protected readonly photos = signal<UploadableFile[]>([]);

  constructor() {
    // Load the team profile (name is required for the created complaint payload).
    effect(() => {
      this.fetchTeam(this.teamId());
    });

    // Projects are only for the optional "related project" selector.
    this.projectsApi.getMyProjects({ pageNo: 1, pageSize: 100 }).subscribe({
      next: (result) => this.projects.set(result.items),
      error: () => this.projects.set([]),
    });

    // "Other" reason toggles a required detail field.
    const otherReason = this.form.controls.reasons.controls.otherReason;
    const detail = this.form.controls.otherReasonDetail;
    otherReason.valueChanges.pipe(takeUntilDestroyed()).subscribe((checked) => {
      this.showOtherDetail.set(checked);
      detail.setValidators(
        checked ? [Validators.required, Validators.maxLength(500)] : [Validators.maxLength(500)],
      );
      detail.updateValueAndValidity();
      if (!checked) {
        detail.setValue('');
      }
    });
  }

  protected retryTeam(): void {
    this.fetchTeam(this.teamId());
  }

  protected submit(): void {
    const team = this.team();
    if (!team || this.submitting()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const reasons: ComplaintReasons = {
      delay: raw.reasons.delay,
      poorQuality: raw.reasons.poorQuality,
      specificationMismatch: raw.reasons.specificationMismatch,
      misconduct: raw.reasons.misconduct,
      otherReason: raw.reasons.otherReason,
      otherReasonDetail: raw.reasons.otherReason ? raw.otherReasonDetail.trim() || undefined : undefined,
    };

    this.submitting.set(true);
    this.complaintsApi
      .createComplaint({
        teamId: this.teamId(),
        teamName: team.name,
        projectId: raw.projectId || undefined,
        description: raw.description.trim(),
        reasons,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.dialog
            .open<boolean, ConfirmDialogData>(ConfirmDialog, {
              data: {
                titleKey: 'complaints.thanks.title',
                bodyKey: 'complaints.thanks.body',
                confirmKey: 'common.close',
              },
            })
            .subscribe(() => {
              void this.router.navigate(['/app/complaints']);
            });
        },
        error: () => {
          this.submitting.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  private fetchTeam(id: string): void {
    this.teamLoading.set(true);
    this.teamError.set(false);
    this.teamsApi.getTeamProfile(id).subscribe({
      next: (team) => {
        this.team.set(team);
        this.teamLoading.set(false);
      },
      error: () => {
        this.team.set(null);
        this.teamError.set(true);
        this.teamLoading.set(false);
      },
    });
  }
}

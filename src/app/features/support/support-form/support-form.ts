import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { SupportApi } from '@core/api/support-api.service';
import { ProjectsApi } from '@core/api/projects-api.service';
import { ToastService } from '@core/toast/toast.service';
import { Project } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { SpinnerOverlay } from '@shared/ui/loader/spinner-overlay';

/**
 * `/app/support/new` — opens a new support request. The project select is
 * populated from the beneficiary's own projects; the chosen project's title
 * is resolved on submit so it can be stored alongside the id.
 */
@Component({
  selector: 'app-support-form',
  imports: [ReactiveFormsModule, TranslatePipe, PageHeader, SpinnerOverlay],
  templateUrl: './support-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportForm {
  private readonly fb = inject(FormBuilder);
  private readonly supportApi = inject(SupportApi);
  private readonly projectsApi = inject(ProjectsApi);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly projects = signal<Project[]>([]);
  protected readonly projectsLoading = signal(false);
  protected readonly projectsError = signal(false);
  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    projectId: ['', [Validators.required]],
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  constructor() {
    this.loadProjects();
  }

  protected loadProjects(): void {
    this.projectsLoading.set(true);
    this.projectsError.set(false);
    this.projectsApi.getMyProjects({ pageNo: 1, pageSize: 50 }).subscribe({
      next: (result) => {
        this.projects.set(result.items);
        this.projectsLoading.set(false);
      },
      error: () => {
        this.projectsLoading.set(false);
        this.projectsError.set(true);
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { projectId, subject, description } = this.form.getRawValue();
    const projectTitle = this.projects().find((project) => project.id === projectId)?.title;

    this.submitting.set(true);
    this.supportApi
      .createTicket({
        projectId,
        projectTitle,
        subject: subject.trim(),
        description: description.trim(),
      })
      .subscribe({
        next: (created) => {
          this.submitting.set(false);
          this.toast.success('support.form.success');
          void this.router.navigate(['/app/support', created.id]);
        },
        error: () => {
          this.submitting.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }
}

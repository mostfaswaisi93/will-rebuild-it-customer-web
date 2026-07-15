import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LucideArrowRight, LucideCalculator, LucidePlus, LucideUsers } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ProjectsApi } from '@core/api/projects-api.service';
import { RequestsApi } from '@core/api/requests-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { Project, ReconstructionRequest, RequestStatus } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';
import { ImpactCard } from '@shared/ui/impact-card/impact-card';

const OPEN_REQUEST_STATUSES: readonly RequestStatus[] = ['new', 'underReview', 'matched', 'accepted'];

/**
 * Beneficiary overview / home page. Fetches projects and requests once on
 * init, derives headline counts, and shows the most recent few of each with
 * quick links into the primary flows.
 */
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, TranslatePipe, PageHeader, StatusPill, ImpactCard, LucideArrowRight, LucideCalculator, LucidePlus, LucideUsers],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly projectsApi = inject(ProjectsApi);
  private readonly requestsApi = inject(RequestsApi);
  private readonly session = inject(SessionStore);

  protected readonly projects = signal<Project[]>([]);
  protected readonly requests = signal<ReconstructionRequest[]>([]);
  protected readonly loading = signal(false);
  protected readonly skeletonRows: readonly number[] = [0, 1, 2, 3];

  protected readonly firstName = computed(() => this.session.user()?.firstName ?? '');

  protected readonly activeProjectsCount = computed(
    () => this.projects().filter((p) => p.status === 'active').length,
  );
  protected readonly deliveredProjectsCount = computed(
    () => this.projects().filter((p) => p.status === 'delivered' || p.status === 'completed').length,
  );
  protected readonly openRequestsCount = computed(
    () => this.requests().filter((r) => OPEN_REQUEST_STATUSES.includes(r.status)).length,
  );

  protected readonly recentProjects = computed(() => this.sortByCreated(this.projects()).slice(0, 4));
  protected readonly recentRequests = computed(() => this.sortByCreated(this.requests()).slice(0, 4));

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      projects: this.projectsApi.getMyProjects({ pageNo: 1, pageSize: 50 }),
      requests: this.requestsApi.getMyRequests({ pageNo: 1, pageSize: 50 }),
    }).subscribe({
      next: ({ projects, requests }) => {
        this.projects.set(projects.items);
        this.requests.set(requests.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private sortByCreated<T extends { createdAt: string }>(list: readonly T[]): T[] {
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

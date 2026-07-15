import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowRight, LucideMapPin } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ProjectsApi } from '@core/api/projects-api.service';
import { Project } from '@core/models';
import { Skeleton } from '@shared/ui/loader/skeleton';
import { StatusPill } from '@shared/ui/status-pill/status-pill';
import { PublicNav } from '../public-nav/public-nav';

const SHOWCASE_PAGE_SIZE = 6;

/**
 * Public landing page for the whole platform, mounted at `/pub`. Fetches a
 * showcase of projects via `ProjectsApi.getMyProjects` — despite the name,
 * the mock backend does not filter by caller identity yet, so this call is
 * safe to make unauthenticated here.
 */
@Component({
  selector: 'app-public-home',
  imports: [RouterLink, LucideArrowRight, LucideMapPin, TranslatePipe, Skeleton, StatusPill, PublicNav],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly projectsApi = inject(ProjectsApi);

  protected readonly projects = signal<Project[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly skeletonPlaceholders = [1, 2, 3];

  constructor() {
    this.loadProjects();
  }

  protected retry(): void {
    this.loadProjects();
  }

  private loadProjects(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.projectsApi.getMyProjects({ pageNo: 1, pageSize: SHOWCASE_PAGE_SIZE }).subscribe({
      next: (result) => {
        this.projects.set(result.items);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }
}

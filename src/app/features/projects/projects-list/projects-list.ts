import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ProjectsApi } from '@core/api/projects-api.service';
import { PROJECT_STATUSES, Project, ProjectStatus } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { Paginator } from '@shared/ui/paginator/paginator';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/**
 * "My projects" list — every reconstruction project tied to the current
 * beneficiary's requests. Hand-rolled responsive table/cards instead of the
 * generic `DataTable` because a `StatusPill` needs to be embedded in a cell,
 * and `DataTable`'s cells are plain-text only.
 */
@Component({
  selector: 'app-projects-list',
  imports: [RouterLink, TranslatePipe, PageHeader, FilterBar, Paginator, StatusPill],
  templateUrl: './projects-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsList {
  private readonly projectsApi = inject(ProjectsApi);

  protected readonly items = signal<Project[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(false);
  protected readonly pageNo = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly status = signal<ProjectStatus | ''>('');
  protected readonly search = signal('');

  protected readonly statusOptions = PROJECT_STATUSES;
  protected readonly skeletonRows: readonly number[] = [0, 1, 2, 3];
  protected readonly skeletonColumns: readonly number[] = [0, 1, 2, 3, 4, 5];

  private isFirstFilterRun = true;

  constructor() {
    // Any change to search/status should snap the page back to 1 (but not on
    // the very first run, which would otherwise be a redundant no-op write).
    effect(() => {
      this.search();
      this.status();
      if (this.isFirstFilterRun) {
        this.isFirstFilterRun = false;
        return;
      }
      this.pageNo.set(1);
    });

    effect(() => {
      const filters = {
        pageNo: this.pageNo(),
        pageSize: this.pageSize(),
        searchKey: this.search() || undefined,
        status: this.status() || undefined,
      };
      this.loading.set(true);
      this.projectsApi.getMyProjects(filters).subscribe({
        next: (result) => {
          this.items.set(result.items);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  protected onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.status.set(value as ProjectStatus | '');
  }

  protected onClearFilters(): void {
    this.status.set('');
  }

  /** Raw ISO substring date formatting only — no shared date pipe exists yet. */
  protected formatDate(iso: string): string {
    return iso.slice(0, 10);
  }
}

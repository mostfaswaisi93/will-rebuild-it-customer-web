import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideCalculator,
  LucideFolderKanban,
  LucideInbox,
  LucideMessageSquare,
} from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import {
  TeamWorkspaceApi,
  TeamWorkspace as TeamWorkspaceData,
} from '@core/api/team-workspace-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { Estimate, Project, ReconstructionRequest, TeamReview } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';
import { ImpactCard } from '@shared/ui/impact-card/impact-card';
import { RatingStars } from '@shared/ui/rating-stars/rating-stars';
import { Skeleton } from '@shared/ui/loader/skeleton';

/** A headline figure rendered as an `ImpactCard` tile. */
interface StatTile {
  labelKey: string;
  valueLabel: string;
}

const PROJECTS_SHOWN = 5;
const REQUESTS_SHOWN = 5;
const ESTIMATES_SHOWN = 5;
const REVIEWS_SHOWN = 3;

/**
 * `/app/team-dashboard` — the reconstruction team's home page. One call to
 * `TeamWorkspaceApi` returns the whole workspace (the backend scopes it to the
 * signed-in team), from which this derives headline stats and the most recent
 * few of each work item, each linking into the corresponding detail flow.
 */
@Component({
  selector: 'app-team-workspace',
  imports: [
    RouterLink,
    DatePipe,
    TranslatePipe,
    PageHeader,
    StatusPill,
    ImpactCard,
    RatingStars,
    Skeleton,
    LucideCalculator,
    LucideFolderKanban,
    LucideInbox,
    LucideMessageSquare,
  ],
  templateUrl: './team-workspace.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamWorkspace {
  private readonly api = inject(TeamWorkspaceApi);
  private readonly session = inject(SessionStore);

  protected readonly workspace = signal<TeamWorkspaceData | null>(null);
  protected readonly loading = signal(true);
  protected readonly hasError = signal(false);

  protected readonly skeletonTiles: readonly number[] = [0, 1, 2, 3, 4, 5];
  protected readonly skeletonRows: readonly number[] = [0, 1, 2];

  protected readonly firstName = computed(() => this.session.user()?.firstName ?? '');
  protected readonly teamName = computed(() => this.workspace()?.team.name ?? '');

  /** The six headline figures, pre-formatted here so the template stays declarative. */
  protected readonly statTiles = computed<StatTile[]>(() => {
    const stats = this.workspace()?.stats;
    if (!stats) {
      return [];
    }
    return [
      { labelKey: 'teamWorkspace.stats.activeProjects', valueLabel: String(stats.activeProjects) },
      { labelKey: 'teamWorkspace.stats.deliveredProjects', valueLabel: String(stats.deliveredProjects) },
      { labelKey: 'teamWorkspace.stats.pendingEstimates', valueLabel: String(stats.pendingEstimates) },
      { labelKey: 'teamWorkspace.stats.openRequests', valueLabel: String(stats.openRequests) },
      { labelKey: 'teamWorkspace.stats.averageRating', valueLabel: `${stats.averageRating.toFixed(1)} / 5` },
      {
        labelKey: 'teamWorkspace.stats.outstandingFunding',
        valueLabel: '$' + stats.outstandingFunding.toLocaleString('en-US'),
      },
    ];
  });

  protected readonly assignedProjects = computed<Project[]>(() =>
    this.sortByCreated(this.workspace()?.projects ?? []).slice(0, PROJECTS_SHOWN),
  );
  protected readonly matchedRequests = computed<ReconstructionRequest[]>(() =>
    this.sortByCreated(this.workspace()?.matchedRequests ?? []).slice(0, REQUESTS_SHOWN),
  );
  protected readonly estimates = computed<Estimate[]>(() =>
    this.sortByCreated(this.workspace()?.estimates ?? []).slice(0, ESTIMATES_SHOWN),
  );
  protected readonly reviews = computed<TeamReview[]>(() =>
    this.sortByCreated(this.workspace()?.reviews ?? []).slice(0, REVIEWS_SHOWN),
  );

  constructor() {
    this.load();
  }

  /** The headline score for a review: the mean of its three criteria. */
  protected overallScore(review: TeamReview): number {
    return (review.workQuality + review.timeliness + review.professionalism) / 3;
  }

  /** Pre-formatted estimate total, matching the currency style used elsewhere. */
  protected estimateTotal(estimate: Estimate): string {
    return '$' + estimate.total.toLocaleString('en-US');
  }

  /** Also bound to the error state's retry button, hence `protected` rather than `private`. */
  protected load(): void {
    this.loading.set(true);
    this.hasError.set(false);

    this.api.getWorkspace().subscribe({
      next: (workspace) => {
        this.workspace.set(workspace);
        this.loading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.loading.set(false);
      },
    });
  }

  private sortByCreated<T extends { createdAt: string }>(list: readonly T[]): T[] {
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

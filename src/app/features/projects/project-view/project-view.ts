import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { LucideBuilding2, LucideFileText, LucideMail, LucidePhone } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ProjectsApi } from '@core/api/projects-api.service';
import { TeamsApi } from '@core/api/teams-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { Project, Team, TeamReview } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';
import { Tabs, TabItem } from '@shared/ui/tabs/tabs';
import { PhaseStepper } from '@shared/ui/phase-stepper/phase-stepper';
import { RatingStars } from '@shared/ui/rating-stars/rating-stars';
import { CarouselModal } from '@shared/ui/carousel-modal/carousel-modal';
import { MapView } from '@shared/ui/map/map';
import { SpinnerOverlay } from '@shared/ui/loader/spinner-overlay';
import { DialogService } from '@shared/ui/dialog/dialog.service';
import { TeamReviewDialog, TeamReviewDialogData } from '../team-review-dialog/team-review-dialog';

/**
 * Project detail page — the single most important screen in the app: this is
 * where a beneficiary family sees concrete proof their home is being
 * rebuilt. `projectId` is route-bound (`withComponentInputBinding()`), so it
 * arrives automatically from `/app/projects/:projectId`.
 */
@Component({
  selector: 'app-project-view',
  imports: [
    TranslatePipe,
    LucideBuilding2,
    LucideFileText,
    LucideMail,
    LucidePhone,
    PageHeader,
    StatusPill,
    Tabs,
    PhaseStepper,
    RatingStars,
    CarouselModal,
    MapView,
    SpinnerOverlay,
  ],
  templateUrl: './project-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectView {
  private readonly projectsApi = inject(ProjectsApi);
  private readonly teamsApi = inject(TeamsApi);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly dialogService = inject(DialogService);

  readonly projectId = input.required<string>();

  protected readonly project = signal<Project | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);

  protected readonly tabItems: TabItem[] = [
    { id: 'details', labelKey: 'projects.view.tabs.details' },
    { id: 'team', labelKey: 'projects.view.tabs.team' },
    { id: 'timeline', labelKey: 'projects.view.tabs.timeline' },
  ];
  protected readonly activeTabId = signal('details');

  protected readonly team = signal<Team | null>(null);
  protected readonly teamLoading = signal(false);
  protected readonly reviews = signal<TeamReview[]>([]);
  private teamLoadedForId: string | null = null;

  protected readonly galleryPhotos = computed(() => {
    const proj = this.project();
    return proj ? [...proj.damagePhotos, ...proj.progressPhotos] : [];
  });
  protected readonly carouselOpen = signal(false);
  protected readonly carouselStartIndex = signal(0);

  protected readonly timelineEntries = computed(() => {
    const proj = this.project();
    if (!proj) {
      return [];
    }
    return [...proj.timeline].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  private readonly currentUserName = computed(() => {
    const user = this.session.user();
    return user ? `${user.firstName} ${user.lastName}`.trim() : '';
  });

  /** The current user's own review of this team, if any — drives "Write a review" vs "Edit review". */
  protected readonly myReview = computed(
    () => this.reviews().find((review) => review.authorName === this.currentUserName()) ?? null,
  );

  constructor() {
    // Reload whenever the route param changes.
    effect(() => {
      this.fetchProject(this.projectId());
    });

    // Lazily fetch the team profile + reviews the first time the Team tab is opened.
    effect(() => {
      const tabId = this.activeTabId();
      const proj = this.project();
      if (tabId !== 'team' || !proj || this.teamLoadedForId === proj.teamId) {
        return;
      }
      this.teamLoadedForId = proj.teamId;
      this.teamLoading.set(true);

      this.teamsApi.getTeamProfile(proj.teamId).subscribe({
        next: (team) => this.team.set(team),
        error: () => this.team.set(null),
      });
      this.teamsApi.getTeamReviews(proj.teamId).subscribe({
        next: (reviews) => {
          this.reviews.set(reviews);
          this.teamLoading.set(false);
        },
        error: () => this.teamLoading.set(false),
      });
    });
  }

  protected reload(): void {
    this.fetchProject(this.projectId());
  }

  private fetchProject(id: string): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.project.set(null);
    this.projectsApi.getProjectDetails(id).subscribe({
      next: (project) => {
        this.project.set(project);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  /** Raw ISO substring date formatting only — no shared date pipe exists yet. */
  protected formatDate(iso: string): string {
    return iso.slice(0, 10);
  }

  protected openGallery(index: number): void {
    this.carouselStartIndex.set(index);
    this.carouselOpen.set(true);
  }

  protected openReviewDialog(proj: Project): void {
    this.dialogService
      .open<TeamReview, TeamReviewDialogData>(TeamReviewDialog, {
        data: { projectId: proj.id, teamId: proj.teamId, existingReview: this.myReview() },
      })
      .subscribe((review) => {
        if (!review) {
          return;
        }
        this.reviews.update((list) => [
          review,
          ...list.filter((existing) => existing.id !== review.id && existing.authorName !== review.authorName),
        ]);
        this.toast.success('projects.teamReview.thanksMessage');
      });
  }
}

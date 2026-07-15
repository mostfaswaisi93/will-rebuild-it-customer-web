import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  LucideBadgeCheck,
  LucideBuilding2,
  LucideCalendar,
  LucideChevronDown,
  LucideFlag,
  LucideLogIn,
  LucideShieldCheck,
} from '@lucide/angular';
import { TeamsApi } from '@core/api/teams-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { Team, TeamReview } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { RatingStars } from '@shared/ui/rating-stars/rating-stars';
import { MapMarker, MapView } from '@shared/ui/map/map';
import { SpinnerOverlay } from '@shared/ui/loader/spinner-overlay';

/** Day-of-week label keys, indexed 0 (Sunday) .. 6 (Saturday) to match `BusinessHours.dayOfWeek`. */
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

/**
 * Team profile — mounted at BOTH `/app/teams/:teamId` (authenticated shell)
 * and `/pub/team/:teamId` (public, no shell). The same component adapts its
 * action buttons based on `sessionStore.isAuthenticated()` rather than the
 * route, since both routes share the exact same `:teamId` param name.
 */
@Component({
  selector: 'app-team-profile',
  imports: [
    RouterLink,
    LucideBadgeCheck,
    LucideBuilding2,
    LucideCalendar,
    LucideChevronDown,
    LucideFlag,
    LucideLogIn,
    LucideShieldCheck,
    TranslatePipe,
    PageHeader,
    RatingStars,
    MapView,
    SpinnerOverlay,
  ],
  templateUrl: './team-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamProfile {
  private readonly teamsApi = inject(TeamsApi);
  private readonly sessionStore = inject(SessionStore);

  readonly teamId = input.required<string>();

  protected readonly isAuthenticated = this.sessionStore.isAuthenticated;

  protected readonly team = signal<Team | null>(null);
  protected readonly reviews = signal<TeamReview[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadError = signal(false);
  protected readonly notFound = signal(false);
  private readonly retryTrigger = signal(0);

  protected readonly workingSinceYear = computed(() => {
    const team = this.team();
    return team ? new Date(team.workingSince).getFullYear() : null;
  });

  protected readonly sortedBusinessHours = computed(() => {
    const team = this.team();
    return team ? [...team.businessHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek) : [];
  });

  protected readonly hasCoordinates = computed(() =>
    (this.team()?.coverageAreas ?? []).some(
      (area) => area.latitude !== undefined && area.longitude !== undefined,
    ),
  );

  protected readonly mapMarkers = computed<MapMarker[]>(() =>
    (this.team()?.coverageAreas ?? [])
      .filter((area) => area.latitude !== undefined && area.longitude !== undefined)
      .map((area, index) => ({
        id: `coverage-${index}`,
        lat: area.latitude as number,
        lng: area.longitude as number,
        label: area.district,
      })),
  );

  constructor() {
    effect(() => {
      const id = this.teamId();
      this.retryTrigger();
      if (!id) {
        return;
      }

      this.loading.set(true);
      this.loadError.set(false);
      this.notFound.set(false);

      forkJoin({
        team: this.teamsApi.getTeamProfile(id),
        reviews: this.teamsApi.getTeamReviews(id),
      }).subscribe({
        next: ({ team, reviews }) => {
          if (this.teamId() !== id) {
            return;
          }
          this.team.set(team);
          this.reviews.set(reviews);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          if (this.teamId() !== id) {
            return;
          }
          this.notFound.set(err.status === 404);
          this.loadError.set(err.status !== 404);
          this.loading.set(false);
        },
      });
    });
  }

  protected retry(): void {
    this.retryTrigger.update((value) => value + 1);
  }

  protected dayKey(dayOfWeek: number): string {
    return DAY_KEYS[dayOfWeek] ?? DAY_KEYS[0];
  }

  protected averageReviewScore(review: TeamReview): number {
    return (review.workQuality + review.timeliness + review.professionalism) / 3;
  }

  protected initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }
}

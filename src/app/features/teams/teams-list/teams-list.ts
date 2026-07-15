import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideHeart, LucideMapPin, LucideUsers } from '@lucide/angular';
import { TeamsApi } from '@core/api/teams-api.service';
import { ToastService } from '@core/toast/toast.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { GAZA_GOVERNORATES, GazaGovernorate, Team } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { Paginator } from '@shared/ui/paginator/paginator';
import { RatingStars } from '@shared/ui/rating-stars/rating-stars';
import { Skeleton } from '@shared/ui/loader/skeleton';

interface SpecializationOption {
  value: string;
  labelKey: string;
}

/**
 * Fixed, curated specialization vocabulary. Team.specializations is a plain
 * `string[]` in the domain model (no server-side controlled vocabulary), and
 * the mock API filters with an exact string match — so these `value`s must
 * stay byte-for-byte identical to the strings seeded in the team fixtures
 * regardless of the active UI language; only the visible label is translated.
 */
const SPECIALIZATION_OPTIONS: SpecializationOption[] = [
  { value: 'Residential', labelKey: 'teams.specialization.residential' },
  { value: 'Commercial', labelKey: 'teams.specialization.commercial' },
  { value: 'Agricultural', labelKey: 'teams.specialization.agricultural' },
  { value: 'Infrastructure', labelKey: 'teams.specialization.infrastructure' },
  { value: 'Structural repair', labelKey: 'teams.specialization.structuralRepair' },
  { value: 'Finishing works', labelKey: 'teams.specialization.finishingWorks' },
];

/** Card-grid directory of reconstruction teams, with search/governorate/specialization filters. */
@Component({
  selector: 'app-teams-list',
  imports: [RouterLink, LucideHeart, LucideMapPin, LucideUsers, TranslatePipe, PageHeader, FilterBar, Paginator, RatingStars, Skeleton],
  templateUrl: './teams-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamsList {
  private readonly teamsApi = inject(TeamsApi);
  private readonly toast = inject(ToastService);

  protected readonly items = signal<Team[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(false);
  protected readonly pageNo = signal(1);
  protected readonly pageSize = signal(12);
  protected readonly specialization = signal('');
  protected readonly governorate = signal('');
  protected readonly search = signal('');

  protected readonly governorateOptions = GAZA_GOVERNORATES;
  protected readonly specializationOptions = SPECIALIZATION_OPTIONS;
  protected readonly skeletonPlaceholders = [0, 1, 2, 3, 4, 5];

  constructor() {
    effect(() => {
      const filters = {
        pageNo: this.pageNo(),
        pageSize: this.pageSize(),
        searchKey: this.search() || undefined,
        specialization: this.specialization() || undefined,
        governorate: this.governorate() || undefined,
      };
      this.loading.set(true);
      this.teamsApi.getTeams(filters).subscribe({
        next: (result) => {
          this.items.set(result.items);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  protected onSearchChange(value: string): void {
    this.search.set(value);
    this.pageNo.set(1);
  }

  protected onGovernorateChange(value: string): void {
    this.governorate.set(value);
    this.pageNo.set(1);
  }

  protected onSpecializationChange(value: string): void {
    this.specialization.set(value);
    this.pageNo.set(1);
  }

  protected onClearFilters(): void {
    this.search.set('');
    this.governorate.set('');
    this.specialization.set('');
    this.pageNo.set(1);
  }

  protected onPageChange(page: number): void {
    this.pageNo.set(page);
  }

  protected distinctGovernorates(team: Team): GazaGovernorate[] {
    return Array.from(new Set(team.coverageAreas.map((area) => area.governorate)));
  }

  protected specializationLabelKey(spec: string): string {
    return SPECIALIZATION_OPTIONS.find((option) => option.value === spec)?.labelKey ?? '';
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

  protected onToggleFollow(team: Team): void {
    const previous = team.isFollowedByCurrentUser ?? false;
    this.setFollowState(team.id, !previous);

    this.teamsApi.toggleFollow(team.id).subscribe({
      next: (isFollowed) => {
        this.setFollowState(team.id, isFollowed);
        this.toast.success(isFollowed ? 'teams.list.followSuccess' : 'teams.list.unfollowSuccess');
      },
      error: () => {
        this.setFollowState(team.id, previous);
        this.toast.danger('common.errorGeneric');
      },
    });
  }

  private setFollowState(teamId: string, isFollowed: boolean): void {
    this.items.update((list) =>
      list.map((team) => (team.id === teamId ? { ...team, isFollowedByCurrentUser: isFollowed } : team)),
    );
  }
}

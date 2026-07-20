import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowRight, LucideMapPin, LucideUsers } from '@lucide/angular';
import { forkJoin } from 'rxjs';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { MasterApi } from '@core/api/master-api.service';
import { TeamsApi } from '@core/api/teams-api.service';
import { GAZA_GOVERNORATES, GazaGovernorate, GeoArea, Team } from '@core/models';
import { Skeleton } from '@shared/ui/loader/skeleton';
import { PublicNav } from '../public-nav/public-nav';

/**
 * Area-first entry funnel — the Gaza counterpart of the original app's
 * zip-code lead-generation page. Instead of a postal code (which does not
 * apply here), a visitor picks their governorate and district, immediately
 * sees which reconstruction teams actually cover that area, and starts from
 * there.
 *
 * Answering "is anyone working where I live?" before asking for any personal
 * details is deliberate: it gives something useful away first, which suits a
 * service for people who have already lost a great deal.
 */
@Component({
  selector: 'app-area-start',
  imports: [RouterLink, LucideArrowRight, LucideMapPin, LucideUsers, TranslatePipe, Skeleton, PublicNav],
  templateUrl: './area-start.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaStart {
  private readonly masterApi = inject(MasterApi);
  private readonly teamsApi = inject(TeamsApi);
  private readonly router = inject(Router);

  protected readonly governorates = GAZA_GOVERNORATES;
  protected readonly geoAreas = signal<GeoArea[]>([]);
  protected readonly teams = signal<Team[]>([]);
  protected readonly loading = signal(true);
  protected readonly hasError = signal(false);

  protected readonly selectedGovernorate = signal<GazaGovernorate | null>(null);
  protected readonly selectedDistrict = signal<string | null>(null);

  /** Districts belonging to the chosen governorate. */
  protected readonly districts = computed(() => {
    const governorate = this.selectedGovernorate();
    if (!governorate) {
      return [];
    }
    return this.geoAreas()
      .filter((area) => area.governorate === governorate)
      .map((area) => area.district);
  });

  /** Teams whose coverage includes the chosen governorate. */
  protected readonly matchingTeams = computed(() => {
    const governorate = this.selectedGovernorate();
    if (!governorate) {
      return [];
    }
    return this.teams().filter((team) =>
      team.coverageAreas.some((area) => area.governorate === governorate),
    );
  });

  /** Total finished rebuilds by the matching teams — concrete evidence, not a slogan. */
  protected readonly completedInArea = computed(() =>
    this.matchingTeams().reduce((sum, team) => sum + team.completedProjectsCount, 0),
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.hasError.set(false);
    forkJoin({
      areas: this.masterApi.getGeoAreas(),
      teams: this.teamsApi.getTeams({ pageNo: 1, pageSize: 50 }),
    }).subscribe({
      next: ({ areas, teams }) => {
        this.geoAreas.set(areas);
        this.teams.set(teams.items);
        this.loading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.loading.set(false);
      },
    });
  }

  protected selectGovernorate(governorate: GazaGovernorate): void {
    this.selectedGovernorate.set(governorate);
    this.selectedDistrict.set(null);
  }

  protected selectDistrict(district: string): void {
    this.selectedDistrict.set(district);
  }

  /**
   * Hands the chosen area to the public damage-report wizard as query params,
   * so the visitor does not re-enter what they already told us.
   */
  protected startRequest(): void {
    const governorate = this.selectedGovernorate();
    if (!governorate) {
      return;
    }
    void this.router.navigate(['/pub/new-beneficiary'], {
      queryParams: {
        governorate,
        district: this.selectedDistrict() ?? undefined,
      },
    });
  }
}

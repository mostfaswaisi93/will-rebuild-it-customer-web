import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideImages, LucideMapPin, LucideUsers } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ProjectsApi } from '@core/api/projects-api.service';
import { Project } from '@core/models';
import { CarouselModal, CarouselPhoto } from '@shared/ui/carousel-modal/carousel-modal';
import { DonationWidget } from '@shared/ui/donation-widget/donation-widget';
import { Spinner } from '@shared/ui/loader/spinner';
import { MapCenter, MapMarker, MapView } from '@shared/ui/map/map';
import { PhaseStepper } from '@shared/ui/phase-stepper/phase-stepper';
import { StatusPill } from '@shared/ui/status-pill/status-pill';
import { PublicNav } from '../public-nav/public-nav';

/**
 * Public project page telling the reconstruction story and inviting
 * donations, mounted at `/pub/project/:projectId`. Uses
 * `ProjectsApi.getPublicProject`, the documented seam for a future narrower
 * public-only endpoint.
 */
@Component({
  selector: 'app-project-public',
  imports: [
    RouterLink,
    LucideImages,
    LucideMapPin,
    LucideUsers,
    TranslatePipe,
    CarouselModal,
    DonationWidget,
    Spinner,
    MapView,
    PhaseStepper,
    StatusPill,
    PublicNav,
  ],
  templateUrl: './project-public.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPublic {
  readonly projectId = input.required<string>();

  private readonly projectsApi = inject(ProjectsApi);
  private readonly router = inject(Router);

  protected readonly project = signal<Project | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);

  protected readonly carouselOpen = signal(false);
  protected readonly carouselStartIndex = signal(0);

  protected readonly carouselPhotos = computed<CarouselPhoto[]>(() =>
    (this.project()?.progressPhotos ?? []).map((photo) => ({ url: photo.url, fileName: photo.fileName })),
  );

  protected readonly mapCenter = computed<MapCenter | undefined>(() => {
    const address = this.project()?.address;
    if (!address || address.latitude === undefined || address.longitude === undefined) {
      return undefined;
    }
    return { lat: address.latitude, lng: address.longitude };
  });

  protected readonly mapMarkers = computed<MapMarker[]>(() => {
    const project = this.project();
    const center = this.mapCenter();
    if (!project || !center) {
      return [];
    }
    return [{ id: project.id, lat: center.lat, lng: center.lng, label: project.title }];
  });

  constructor() {
    // Reacts to `projectId()` so navigating between two project pages (if
    // the route is ever reused rather than recreated) still reloads data.
    effect(() => {
      this.loadProject(this.projectId());
    });
  }

  protected retry(): void {
    this.loadProject(this.projectId());
  }

  protected onDonate(): void {
    const project = this.project();
    void this.router.navigate(['/app/donations/new'], { queryParams: { projectId: project?.id } });
  }

  protected openCarousel(index: number): void {
    this.carouselStartIndex.set(index);
    this.carouselOpen.set(true);
  }

  private loadProject(id: string): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.project.set(null);
    this.projectsApi.getPublicProject(id).subscribe({
      next: (project) => {
        this.project.set(project);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }
}

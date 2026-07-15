import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideImage, LucideMapPin, LucidePhone, LucideUser, LucideUsers } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { RequestsApi } from '@core/api/requests-api.service';
import { ReconstructionRequest } from '@core/models';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';
import { Tabs, TabItem } from '@shared/ui/tabs/tabs';
import { CarouselModal, CarouselPhoto } from '@shared/ui/carousel-modal/carousel-modal';
import { MapView, MapMarker } from '@shared/ui/map/map';
import { SpinnerOverlay } from '@shared/ui/loader/spinner-overlay';

/**
 * `/app/requests/:requestId` — a beneficiary's own request detail page:
 * damage details, contact info (unmasked — this is the owner's own data),
 * and matched-team suggestions/assignment.
 */
@Component({
  selector: 'app-request-view',
  imports: [
    RouterLink,
    TranslatePipe,
    PageHeader,
    StatusPill,
    Tabs,
    CarouselModal,
    MapView,
    SpinnerOverlay,
    LucideImage,
    LucideMapPin,
    LucidePhone,
    LucideUser,
    LucideUsers,
  ],
  templateUrl: './request-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestView {
  private readonly requestsApi = inject(RequestsApi);

  readonly requestId = input.required<string>();

  protected readonly request = signal<ReconstructionRequest | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadError = signal(false);

  protected readonly headerTitle = computed(() => this.request()?.requestNumber ?? this.requestId());

  protected readonly tabItems: TabItem[] = [
    { id: 'damage', labelKey: 'requests.view.tabs.damage' },
    { id: 'contact', labelKey: 'requests.view.tabs.contact' },
    { id: 'teams', labelKey: 'requests.view.tabs.teams' },
  ];
  protected readonly activeTabId = signal('damage');

  protected readonly carouselOpen = signal(false);
  protected readonly carouselStartIndex = signal(0);

  protected readonly attachmentPhotos = computed<CarouselPhoto[]>(
    () => this.request()?.attachments.map((attachment) => ({ url: attachment.url, fileName: attachment.fileName })) ?? [],
  );

  protected readonly mapCenter = computed(() => {
    const address = this.request()?.address;
    if (!address || address.latitude === undefined || address.longitude === undefined) {
      return undefined;
    }
    return { lat: address.latitude, lng: address.longitude };
  });

  protected readonly mapMarkers = computed<MapMarker[]>(() => {
    const request = this.request();
    const center = this.mapCenter();
    if (!request || !center) {
      return [];
    }
    return [{ id: request.id, lat: center.lat, lng: center.lng, label: request.requestNumber }];
  });

  constructor() {
    effect(() => {
      this.fetchRequest(this.requestId());
    });
  }

  protected retry(): void {
    this.fetchRequest(this.requestId());
  }

  protected openCarousel(index: number): void {
    this.carouselStartIndex.set(index);
    this.carouselOpen.set(true);
  }

  protected matchScorePercent(score: number): number {
    return Math.round(score * 100);
  }

  private fetchRequest(id: string): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.requestsApi.getRequestDetails(id).subscribe({
      next: (result) => {
        this.request.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.request.set(null);
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }
}

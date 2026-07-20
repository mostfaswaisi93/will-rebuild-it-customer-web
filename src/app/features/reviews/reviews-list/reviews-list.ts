import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideStar } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { AuthoredReview, ReviewsApi } from '@core/api/reviews-api.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { RatingStars } from '@shared/ui/rating-stars/rating-stars';
import { Skeleton } from '@shared/ui/loader/skeleton';

/**
 * `/app/reviews` — the reviews the signed-in beneficiary has written about the
 * reconstruction teams that worked on their projects, newest data straight from
 * the API (the list is short enough that it needs no paging or filtering).
 */
@Component({
  selector: 'app-reviews-list',
  imports: [RouterLink, DatePipe, TranslatePipe, PageHeader, RatingStars, Skeleton, LucideStar],
  templateUrl: './reviews-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsList {
  private readonly reviewsApi = inject(ReviewsApi);

  protected readonly reviews = signal<AuthoredReview[]>([]);
  protected readonly loading = signal(true);
  protected readonly hasError = signal(false);

  protected readonly skeletonCards: readonly number[] = [0, 1, 2];

  constructor() {
    this.load();
  }

  /** The headline score for a review: the mean of its three criteria. */
  protected overallScore(review: AuthoredReview): number {
    return (review.workQuality + review.timeliness + review.professionalism) / 3;
  }

  /** Also bound to the error state's retry button, hence `protected` rather than `private`. */
  protected load(): void {
    this.loading.set(true);
    this.hasError.set(false);

    this.reviewsApi.getMyReviews().subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.loading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.loading.set(false);
      },
    });
  }
}
